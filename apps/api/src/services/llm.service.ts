import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ErrorPattern } from '../database/entities/student-response.entity';

const DEFAULT_BEDROCK_MODEL = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
const DEFAULT_OPENAI_MODEL = 'gpt-4o';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export const DIFFICULTY_SPECS: Record<number, {
  wordRange: [number, number];
  vocabulary: string;
  sentenceStructure: string;
  passageComplexity: string;
  questionStyle: string;
  distractorDesign: string;
}> = {
  1: {
    wordRange: [25, 60],
    vocabulary: 'Common everyday vocabulary, grade 8-9 reading level',
    sentenceStructure: 'Short, simple and compound sentences. No complex subordination.',
    passageComplexity: 'Single clear idea or brief narrative. Explicit meaning. No ambiguity.',
    questionStyle: 'Direct recall and simple inference. "According to the text..." format.',
    distractorDesign: 'One plausible distractor, two clearly wrong. Correct answer almost verbatim from text.',
  },
  2: {
    wordRange: [40, 80],
    vocabulary: 'Some academic vocabulary, grade 10 level. Define uncommon words in context.',
    sentenceStructure: 'Mix of simple and complex sentences. Some subordinate clauses.',
    passageComplexity: 'Two related ideas or a cause-effect relationship. Mostly explicit.',
    questionStyle: 'Basic inference and vocabulary in context. Some "most likely means" questions.',
    distractorDesign: 'Two plausible distractors. Correct answer requires careful re-reading.',
  },
  3: {
    wordRange: [60, 100],
    vocabulary: 'SAT-level academic vocabulary. Words with multiple meanings used in specific senses.',
    sentenceStructure: 'Complex sentences with subordination, appositives, and parallel structure.',
    passageComplexity: 'A nuanced point or implicit reasoning required within a concise text.',
    questionStyle: 'Inference, author purpose, evidence evaluation. "Which choice best supports..." format.',
    distractorDesign: 'Three plausible distractors with subtle differences. Requires precise textual evidence.',
  },
  4: {
    wordRange: [80, 130],
    vocabulary: 'Advanced academic and domain-specific vocabulary. Sophisticated word choices.',
    sentenceStructure: 'Complex sentences with multiple clauses, inversions, and embedded quotations.',
    passageComplexity: 'Implicit author stance, irony, or competing ideas within a short excerpt.',
    questionStyle: 'Analyze rhetorical strategy, evaluate claims, compare implicit viewpoints.',
    distractorDesign: 'All four choices highly plausible. Distinguishing requires precise textual evidence and reasoning.',
  },
  5: {
    wordRange: [100, 150],
    vocabulary: 'College-level, archaic, or specialized terminology. Dense academic register.',
    sentenceStructure: 'Dense, nested subordination, periodic sentences, formal/archaic syntax patterns.',
    passageComplexity: 'Abstract argument or layered irony within a dense, compact excerpt. Unstated assumptions.',
    questionStyle: 'Evaluate logical structure, identify unstated assumptions, synthesize across the passage.',
    distractorDesign: 'All four choices defensible on surface reading. Correct answer requires precise textual evidence AND multi-step reasoning.',
  },
};

export interface ErrorClassificationInput {
  questionId: string;
  stem: string;
  choices: { label: string; text: string }[];
  chosenAnswer: number;
  correctAnswer: number;
  explanation: string | null;
}

export interface ErrorClassificationResult {
  questionId: string;
  pattern: ErrorPattern;
  reasoning: string;
}

export interface TipGenerationContext {
  weakestSkills: { name: string; ability: number }[];
  recentErrors: {
    question: string;
    chosenAnswer: string;
    correctAnswer: string;
  }[];
  passageTypesStruggled: string[];
  existingTips?: string[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: string;
  private bedrockClient?: BedrockRuntimeClient;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('LLM_PROVIDER') || 'bedrock';
    if (this.provider === 'bedrock') {
      const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
      this.bedrockClient = new BedrockRuntimeClient({ region });
    }
    this.logger.log(`LLM provider: ${this.provider}`);
  }

  /**
   * Unified LLM call that routes to the configured provider.
   */
  private async callLlm(prompt: string, maxTokens: number): Promise<string> {
    switch (this.provider) {
      case 'openai':
        return this.callOpenAI(prompt, maxTokens);
      case 'anthropic':
        return this.callAnthropic(prompt, maxTokens);
      default:
        return this.callBedrock(prompt, maxTokens);
    }
  }

  private async callBedrock(prompt: string, maxTokens: number): Promise<string> {
    const modelId = this.configService.get<string>('BEDROCK_MODEL') || DEFAULT_BEDROCK_MODEL;
    const command = new ConverseCommand({
      modelId,
      messages: [{ role: 'user', content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens },
    });
    const response = await this.bedrockClient!.send(command);
    const text = response.output?.message?.content?.[0]?.text;
    if (!text) throw new Error('No text in Bedrock response');
    return text;
  }

  private async callOpenAI(prompt: string, maxTokens: number): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    const model = this.configService.get<string>('OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;
    const baseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No text in OpenAI response');
    return text;
  }

  private async callAnthropic(prompt: string, maxTokens: number): Promise<string> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
    const model = this.configService.get<string>('ANTHROPIC_MODEL') || DEFAULT_ANTHROPIC_MODEL;
    const baseUrl = this.configService.get<string>('ANTHROPIC_BASE_URL') || 'https://api.anthropic.com';

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const data: any = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('No text in Anthropic response');
    return text;
  }

  async generateTip(
    context: TipGenerationContext,
  ): Promise<{ content: string; category: string }> {
    const skillsList = context.weakestSkills
      .map((s) => `${s.name} (ability: ${s.ability.toFixed(2)})`)
      .join(', ');

    const errorsList = context.recentErrors
      .map(
        (e) =>
          `Question: "${e.question}" | Chose: ${e.chosenAnswer} | Correct: ${e.correctAnswer}`,
      )
      .join('\n  ');

    const passageTypes = context.passageTypesStruggled.join(', ') || 'none identified';

    const existingTipsSection = context.existingTips?.length
      ? `\n- Tips already given (DO NOT repeat similar advice):\n  ${context.existingTips.map((t, i) => `${i + 1}. "${t}"`).join('\n  ')}`
      : '';

    const prompt = `You are an expert SAT Reading tutor. Based on this student's recent performance:
- Weakest skills: ${skillsList}
- Recent errors:
  ${errorsList}
- Passage types struggled with: ${passageTypes}${existingTipsSection}

Generate a specific, actionable tip (2-3 sentences) that addresses their most impactful weakness. The tip must be distinct from any previously given tips — cover a different angle, skill, or strategy.

Respond in JSON format: { "content": "your tip here", "category": "error_pattern|strategy|timing|encouragement|passage_type" }`;

    try {
      const text = await this.callLlm(prompt, 300);
      const parsed = JSON.parse(text);
      return {
        content: parsed.content,
        category: parsed.category,
      };
    } catch (error) {
      this.logger.error('Tip generation failed', error);
      return this.fallbackTip();
    }
  }

  async generateExerciseContent(params: {
    targetSkills: { id: string; name: string }[];
    difficulty: number;
    passageType: string;
    errorPatterns?: {
      skillName: string;
      skillId: string;
      examples: {
        question: string;
        studentAnswer: string;
        correctAnswer: string;
      }[];
    }[];
    excludeTopics?: string[];
  }): Promise<{
    items: {
      passage: {
        title: string;
        text: string;
        source: string;
      };
      question: {
        stem: string;
        choices: { label: string; text: string }[];
        correctAnswer: number;
        explanation: string;
        hint: string;
        difficulty: number;
        skillIds: string[];
      };
    }[];
  }> {
    const skillsList = params.targetSkills
      .map((s) => `${s.id} ("${s.name}")`)
      .join(', ');

    // Build error pattern context if available
    let errorPatternSection = '';
    if (params.errorPatterns && params.errorPatterns.length > 0) {
      const lines = params.errorPatterns.map((ep) => {
        const exLines = ep.examples
          .map(
            (ex) =>
              `    - Q: "${ex.question}" | Student chose: "${ex.studentAnswer}" | Correct: "${ex.correctAnswer}"`,
          )
          .join('\n');
        return `  ${ep.skillName} (${ep.skillId}):\n${exLines}`;
      });
      errorPatternSection = `
STUDENT ERROR ANALYSIS (use this to craft targeted questions):
The student repeatedly makes these mistakes:
${lines.join('\n')}

Design questions that specifically address these error patterns. For example:
- If the student confuses main idea with supporting detail, create a question where the distractors are tempting supporting details.
- If the student picks overly literal interpretations, create a question requiring inference with a literal-sounding distractor.
- The explanations should directly address why the student's typical mistake is wrong.
`;
    }

    // Build exclusion section for previously seen passages
    const excludeTopics = params.excludeTopics || [];
    let excludeSection = '';
    if (excludeTopics.length > 0) {
      excludeSection = `
IMPORTANT — DO NOT reuse these passage topics (the student has already seen them):
${excludeTopics.map((t) => `- ${t}`).join('\n')}
Generate completely different passages on new topics.
`;
    }

    const spec = DIFFICULTY_SPECS[params.difficulty] || DIFFICULTY_SPECS[3];

    const prompt = `You are an expert Digital SAT Reading & Writing content author. Generate 5 independent reading items in the Digital SAT format. Each item consists of a SHORT passage with exactly 1 question.

Requirements:
- Passage type: ${params.passageType}
- Target difficulty: ${params.difficulty}/5
- PASSAGE SPECIFICATIONS (Digital SAT format — one short passage per question):
  * Word count per passage: ${spec.wordRange[0]}-${spec.wordRange[1]} words (MUST be in this range)
  * Vocabulary level: ${spec.vocabulary}
  * Sentence structure: ${spec.sentenceStructure}
  * Overall complexity: ${spec.passageComplexity}
- QUESTION SPECIFICATIONS:
  * Style: ${spec.questionStyle}
  * Distractor design: ${spec.distractorDesign}
- Target skills: ${skillsList}
- Generate exactly 5 items, each with a DIFFERENT short passage and 1 question
- Each passage must be on a DIFFERENT topic/subject within the ${params.passageType} type
- Each question must have exactly 4 answer choices labeled A, B, C, D
- Include plausible distractors that reflect common student mistakes
- Explanations should teach why the correct answer is right AND why key distractors are wrong
- Each passage source should be a realistic fictional attribution
- Distribute the target skills across the 5 questions (at least one question per skill)
- CRITICAL: If a passage contains statistics or numerical data, verify internal consistency
${excludeSection}${errorPatternSection}

Respond with ONLY valid JSON in this exact format:
{
  "items": [
    {
      "passage": {
        "title": "string",
        "text": "string (the full passage text, ${spec.wordRange[0]}-${spec.wordRange[1]} words)",
        "source": "string (fictional attribution)"
      },
      "question": {
        "stem": "string (the question)",
        "choices": [
          { "label": "A", "text": "string" },
          { "label": "B", "text": "string" },
          { "label": "C", "text": "string" },
          { "label": "D", "text": "string" }
        ],
        "correctAnswer": 0,
        "explanation": "string",
        "hint": "string (a brief hint without giving away the answer)",
        "difficulty": ${params.difficulty},
        "skillIds": ["skill_id_1"]
      }
    }
  ]
}

IMPORTANT: correctAnswer is a 0-based index (0=A, 1=B, 2=C, 3=D). Each question's skillIds must be chosen from: ${skillsList}.`;

    try {
      const text = await this.callLlm(prompt, 4000);

      // Extract JSON from response (handle possible markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Exercise generation failed', error);
      throw error;
    }
  }

  async classifyErrorPatterns(
    passageText: string,
    wrongAnswers: ErrorClassificationInput[],
  ): Promise<ErrorClassificationResult[]> {
    if (wrongAnswers.length === 0) return [];

    const answersText = wrongAnswers
      .map((wa, i) => {
        const choicesText = wa.choices
          .map((c) => `${c.label}: ${c.text}`)
          .join('\n    ');
        const chosenLabel = wa.choices[wa.chosenAnswer]?.label ?? '?';
        const correctLabel = wa.choices[wa.correctAnswer]?.label ?? '?';
        return `  ${i + 1}. [ID: ${wa.questionId}] Question: "${wa.stem}"
    Choices:
    ${choicesText}
    Student chose: ${chosenLabel}
    Correct answer: ${correctLabel}
    Explanation: ${wa.explanation || 'N/A'}`;
      })
      .join('\n\n');

    const prompt = `You are an expert SAT Reading error analyst. Given a passage and the student's wrong answers, classify each error into exactly one cognitive error pattern.

Passage:
"${passageText}"

Wrong answers:
${answersText}

Error pattern categories:
- over_inference: Student read too much into the text, assuming things not supported by evidence
- polarity_trap: Student picked an answer with the opposite meaning/direction (e.g., "supports" vs "undermines")
- evidence_mismatch: Student chose an answer referencing different evidence than what the question asks about
- scope_error: Student confused a detail for a main idea, or vice versa (too broad or too narrow)

Respond with ONLY valid JSON array. Use the exact question IDs from above (the [ID: ...] values):
[{ "questionId": "<exact ID from above>", "pattern": "over_inference|polarity_trap|evidence_mismatch|scope_error", "reasoning": "One sentence explanation" }]`;

    try {
      const text = await this.callLlm(prompt, 500);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('No JSON array in error classification response');
        return [];
      }

      const parsed: { questionId: string; pattern: string; reasoning: string }[] = JSON.parse(jsonMatch[0]);
      const validPatterns = new Set(Object.values(ErrorPattern));

      return parsed
        .filter((p) => validPatterns.has(p.pattern as ErrorPattern))
        .map((p) => ({
          questionId: p.questionId,
          pattern: p.pattern as ErrorPattern,
          reasoning: p.reasoning,
        }));
    } catch (error) {
      this.logger.error('Error pattern classification failed', error);
      return [];
    }
  }

  async generateStepByStep(params: {
    passageText: string;
    stem: string;
    choices: { label: string; text: string }[];
    correctAnswer: number;
    explanation: string | null;
  }): Promise<string> {
    const choicesText = params.choices
      .map((c) => `${c.label}: ${c.text}`)
      .join('\n');
    const correctLabel = params.choices[params.correctAnswer]?.label ?? '?';

    const prompt = `You are an SAT Reading tutor. Walk through this question step-by-step, showing your reasoning process as if you were teaching a student how to approach it.

Passage:
"${params.passageText}"

Question: "${params.stem}"

Choices:
${choicesText}

Correct answer: ${correctLabel}
${params.explanation ? `Explanation: ${params.explanation}` : ''}

Provide a numbered step-by-step reasoning walkthrough (4-6 steps). Each step should:
1. Start with what to look for or think about
2. Show how to evaluate each choice
3. Explain why wrong answers are tempting but incorrect
4. Arrive at the correct answer with clear justification

Write in a clear, encouraging teaching tone. Do NOT use markdown headers — just numbered steps with plain text.`;

    try {
      return await this.callLlm(prompt, 800);
    } catch (error) {
      this.logger.error('Step-by-step generation failed', error);
      return params.explanation || 'Step-by-step reasoning is not available for this question.';
    }
  }

  async generateSimilarQuestion(params: {
    passageText: string;
    stem: string;
    choices: { label: string; text: string }[];
    skillNames: string[];
    difficulty: number;
  }): Promise<{
    stem: string;
    choices: { label: string; text: string }[];
    correctAnswer: number;
    explanation: string;
  }> {
    const prompt = `You are an SAT Reading test content author. Generate ONE new question that tests the same skill as the original but with a different angle.

Passage:
"${params.passageText}"

Original question for reference (do NOT copy it):
"${params.stem}"

Skills tested: ${params.skillNames.join(', ')}
Difficulty: ${params.difficulty}/5

The new question should:
- Be answerable using ONLY the passage above — all answer choices must be grounded in the passage text
- Test the same skill(s) but ask about a different aspect
- Have 4 choices (A, B, C, D) with plausible distractors whose numerical values and facts match the passage
- Be at a similar difficulty level
- Include a clear explanation referencing specific passage evidence

Respond with ONLY valid JSON:
{
  "stem": "the new question",
  "choices": [
    { "label": "A", "text": "..." },
    { "label": "B", "text": "..." },
    { "label": "C", "text": "..." },
    { "label": "D", "text": "..." }
  ],
  "correctAnswer": 0,
  "explanation": "why the correct answer is right"
}

correctAnswer is 0-based (0=A, 1=B, 2=C, 3=D).`;

    try {
      const text = await this.callLlm(prompt, 600);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Similar question generation failed', error);
      throw error;
    }
  }

  private fallbackTip(): { content: string; category: string } {
    return {
      content:
        'Keep practicing consistently! Focus on understanding why each answer is correct, not just which answer is correct. Review your mistakes to identify patterns.',
      category: 'encouragement',
    };
  }
}
