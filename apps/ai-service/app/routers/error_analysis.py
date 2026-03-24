from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np

router = APIRouter()


class StudentResponse(BaseModel):
    question_id: str
    skill_ids: list[str]
    passage_type: str
    chosen_answer: int
    correct_answer: int
    is_correct: bool
    time_spent_seconds: Optional[int] = None
    difficulty: int


class ErrorAnalysisRequest(BaseModel):
    student_id: str
    responses: list[StudentResponse]


class ErrorPattern(BaseModel):
    pattern_type: str
    description: str
    confidence: float
    affected_skills: list[str]
    recommendation: str


class ErrorAnalysisResponse(BaseModel):
    student_id: str
    patterns: list[ErrorPattern]
    summary: str


@router.post("/analyze", response_model=ErrorAnalysisResponse)
async def analyze_errors(request: ErrorAnalysisRequest):
    """Detect systematic error patterns from student responses."""
    responses = request.responses
    patterns: list[ErrorPattern] = []

    if not responses:
        return ErrorAnalysisResponse(
            student_id=request.student_id,
            patterns=[],
            summary="No responses to analyze.",
        )

    incorrect = [r for r in responses if not r.is_correct]
    total = len(responses)
    incorrect_count = len(incorrect)

    # Pattern 1: Passage type weakness
    passage_type_errors: dict[str, list] = {}
    passage_type_total: dict[str, int] = {}
    for r in responses:
        passage_type_total[r.passage_type] = passage_type_total.get(r.passage_type, 0) + 1
        if not r.is_correct:
            passage_type_errors.setdefault(r.passage_type, []).append(r)

    for pt, errors in passage_type_errors.items():
        error_rate = len(errors) / passage_type_total[pt]
        overall_error_rate = incorrect_count / total if total > 0 else 0
        if error_rate > overall_error_rate + 0.15 and len(errors) >= 2:
            patterns.append(ErrorPattern(
                pattern_type="passage_type_weakness",
                description=f"Significantly higher error rate on {pt} passages ({error_rate:.0%} vs {overall_error_rate:.0%} overall)",
                confidence=min(0.95, 0.5 + len(errors) * 0.1),
                affected_skills=[pt],
                recommendation=f"Focus practice on {pt} passages. Read the passage more carefully before answering questions.",
            ))

    # Pattern 2: Skill-level weakness
    skill_errors: dict[str, int] = {}
    skill_total: dict[str, int] = {}
    for r in responses:
        for sid in r.skill_ids:
            skill_total[sid] = skill_total.get(sid, 0) + 1
            if not r.is_correct:
                skill_errors[sid] = skill_errors.get(sid, 0) + 1

    for sid, err_count in skill_errors.items():
        total_for_skill = skill_total.get(sid, 1)
        skill_error_rate = err_count / total_for_skill
        if skill_error_rate > 0.6 and total_for_skill >= 3:
            patterns.append(ErrorPattern(
                pattern_type="skill_weakness",
                description=f"Weak performance on skill {sid} ({err_count}/{total_for_skill} incorrect)",
                confidence=min(0.95, 0.5 + total_for_skill * 0.05),
                affected_skills=[sid],
                recommendation=f"Review strategies for {sid}. Practice with easier questions first.",
            ))

    # Pattern 3: Time pressure errors
    timed_responses = [r for r in responses if r.time_spent_seconds is not None]
    if len(timed_responses) >= 5:
        times = [r.time_spent_seconds for r in timed_responses]
        avg_time = np.mean(times)
        fast_incorrect = [r for r in timed_responses if not r.is_correct and r.time_spent_seconds < avg_time * 0.5]
        if len(fast_incorrect) >= 2:
            patterns.append(ErrorPattern(
                pattern_type="time_pressure",
                description=f"{len(fast_incorrect)} incorrect answers given very quickly (under {avg_time*0.5:.0f}s vs {avg_time:.0f}s avg)",
                confidence=min(0.9, 0.4 + len(fast_incorrect) * 0.1),
                affected_skills=[],
                recommendation="Slow down on questions you find difficult. Use all available time.",
            ))

    # Pattern 4: Fatigue effect (more errors toward end)
    if len(responses) >= 10:
        first_half = responses[:len(responses)//2]
        second_half = responses[len(responses)//2:]
        first_error_rate = sum(1 for r in first_half if not r.is_correct) / len(first_half)
        second_error_rate = sum(1 for r in second_half if not r.is_correct) / len(second_half)
        if second_error_rate > first_error_rate + 0.2:
            patterns.append(ErrorPattern(
                pattern_type="fatigue_effect",
                description=f"Error rate increases from {first_error_rate:.0%} to {second_error_rate:.0%} in second half",
                confidence=0.7,
                affected_skills=[],
                recommendation="Take short breaks during long practice sessions. Try practicing in shorter bursts.",
            ))

    # Pattern 5: Difficulty mismatch
    hard_incorrect = [r for r in incorrect if r.difficulty >= 4]
    easy_incorrect = [r for r in incorrect if r.difficulty <= 2]
    if len(hard_incorrect) > len(incorrect) * 0.7 and len(hard_incorrect) >= 3:
        patterns.append(ErrorPattern(
            pattern_type="difficulty_mismatch",
            description=f"Most errors ({len(hard_incorrect)}/{incorrect_count}) on high-difficulty questions",
            confidence=0.8,
            affected_skills=[],
            recommendation="Build confidence with medium-difficulty questions before tackling harder ones.",
        ))

    summary_parts = []
    if not patterns:
        summary_parts.append("No significant error patterns detected.")
    else:
        summary_parts.append(f"Detected {len(patterns)} error pattern(s).")
        for p in patterns:
            summary_parts.append(f"- {p.pattern_type}: {p.description}")

    return ErrorAnalysisResponse(
        student_id=request.student_id,
        patterns=patterns,
        summary="\n".join(summary_parts),
    )
