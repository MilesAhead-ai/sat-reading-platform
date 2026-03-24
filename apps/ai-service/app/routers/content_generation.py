import os
import json
import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"


def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )


class PassageGenerationRequest(BaseModel):
    passage_type: str  # literature, history, science, social_science
    difficulty: int  # 1-5
    word_count_target: int = 250
    topic: Optional[str] = None


class QuestionGenerationRequest(BaseModel):
    passage_text: str
    passage_type: str
    target_skills: list[str]
    num_questions: int = 4
    difficulty: int = 3


class GeneratedPassage(BaseModel):
    title: str
    text: str
    type: str
    difficulty: int
    word_count: int
    source: str


class GeneratedQuestion(BaseModel):
    stem: str
    choices: list[dict]
    correct_answer: int
    explanation: str
    hint: str
    difficulty: int
    skills: list[str]


class ContentGenerationResponse(BaseModel):
    status: str
    passage: Optional[GeneratedPassage] = None
    questions: Optional[list[GeneratedQuestion]] = None


def invoke_bedrock(prompt: str, max_tokens: int = 1500) -> str:
    client = get_bedrock_client()
    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {"role": "user", "content": [{"text": prompt}]},
        ],
        inferenceConfig={"maxTokens": max_tokens},
    )
    text = response["output"]["message"]["content"][0]["text"]
    return text


@router.post("/generate-passage", response_model=ContentGenerationResponse)
async def generate_passage(request: PassageGenerationRequest):
    """Generate a new SAT-style reading passage using LLM."""
    topic_instruction = f" about {request.topic}" if request.topic else ""
    difficulty_desc = {1: "simple vocabulary and straightforward ideas", 2: "moderate vocabulary with some nuance", 3: "college-level vocabulary and complex ideas", 4: "advanced vocabulary with subtle arguments", 5: "sophisticated academic prose with complex reasoning"}

    prompt = f"""Generate an SAT-style reading passage with these specifications:
- Type: {request.passage_type}
- Difficulty level: {request.difficulty}/5 ({difficulty_desc.get(request.difficulty, 'moderate')})
- Target word count: {request.word_count_target} words{topic_instruction}

The passage should be realistic, educational, and appropriate for SAT preparation.

Respond in JSON format:
{{
  "title": "passage title",
  "text": "the full passage text"
}}"""

    text = invoke_bedrock(prompt, max_tokens=1500)
    result = json.loads(text)

    passage = GeneratedPassage(
        title=result["title"],
        text=result["text"],
        type=request.passage_type,
        difficulty=request.difficulty,
        word_count=len(result["text"].split()),
        source="ai_generated",
    )

    return ContentGenerationResponse(status="generated", passage=passage)


@router.post("/generate-questions", response_model=ContentGenerationResponse)
async def generate_questions(request: QuestionGenerationRequest):
    """Generate SAT-style questions for a given passage."""
    skills_str = ", ".join(request.target_skills)

    prompt = f"""Given this SAT reading passage:

\"\"\"
{request.passage_text}
\"\"\"

Generate {request.num_questions} SAT-style multiple choice questions testing these skills: {skills_str}

Each question should have 4 choices (A-D), one correct answer, an explanation, and a hint.
Difficulty level: {request.difficulty}/5

Respond in JSON format:
{{
  "questions": [
    {{
      "stem": "question text",
      "choices": [{{"label": "A", "text": "choice text"}}, {{"label": "B", "text": "..."}}, {{"label": "C", "text": "..."}}, {{"label": "D", "text": "..."}}],
      "correct_answer": 0,
      "explanation": "why the correct answer is right",
      "hint": "a hint to help the student",
      "difficulty": {request.difficulty},
      "skills": ["skill_id"]
    }}
  ]
}}

correct_answer is a 0-based index (0=A, 1=B, 2=C, 3=D)."""

    text = invoke_bedrock(prompt, max_tokens=3000)
    result = json.loads(text)

    questions = [
        GeneratedQuestion(**q)
        for q in result["questions"]
    ]

    return ContentGenerationResponse(status="generated", questions=questions)
