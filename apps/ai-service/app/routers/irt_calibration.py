from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
from scipy.optimize import minimize

router = APIRouter()


class ResponseData(BaseModel):
    question_id: str
    student_ability: float
    is_correct: bool


class CalibrationRequest(BaseModel):
    question_id: str
    responses: list[ResponseData]
    current_discrimination: float = 1.0
    current_difficulty: float = 0.0
    current_guessing: float = 0.25


class CalibrationResult(BaseModel):
    question_id: str
    discrimination: float
    difficulty: float
    guessing: float
    sample_size: int
    fit_rmse: float


class AbilityEstimationRequest(BaseModel):
    responses: list[dict]  # [{difficulty, discrimination, guessing, is_correct}]


class AbilityEstimationResult(BaseModel):
    ability: float
    standard_error: float


def irt_3pl_probability(ability: float, a: float, b: float, c: float) -> float:
    """3-Parameter Logistic IRT model: P(correct) = c + (1-c) / (1 + exp(-a(ability - b)))"""
    exponent = -a * (ability - b)
    exponent = np.clip(exponent, -50, 50)
    return c + (1 - c) / (1 + np.exp(exponent))


@router.post("/calibrate", response_model=CalibrationResult)
async def calibrate_question(request: CalibrationRequest):
    """Calibrate IRT parameters for a question using maximum likelihood estimation."""
    responses = request.responses

    if len(responses) < 10:
        return CalibrationResult(
            question_id=request.question_id,
            discrimination=request.current_discrimination,
            difficulty=request.current_difficulty,
            guessing=request.current_guessing,
            sample_size=len(responses),
            fit_rmse=0.0,
        )

    abilities = np.array([r.student_ability for r in responses])
    correct = np.array([1.0 if r.is_correct else 0.0 for r in responses])

    def neg_log_likelihood(params):
        a, b, c = params
        if a <= 0 or c < 0 or c > 0.5:
            return 1e10
        probs = np.array([irt_3pl_probability(theta, a, b, c) for theta in abilities])
        probs = np.clip(probs, 1e-10, 1 - 1e-10)
        ll = np.sum(correct * np.log(probs) + (1 - correct) * np.log(1 - probs))
        return -ll

    result = minimize(
        neg_log_likelihood,
        x0=[request.current_discrimination, request.current_difficulty, request.current_guessing],
        method="Nelder-Mead",
        options={"maxiter": 1000},
    )

    a, b, c = result.x
    a = max(0.1, min(3.0, a))
    b = max(-3.0, min(3.0, b))
    c = max(0.0, min(0.5, c))

    # Calculate RMSE
    predicted = np.array([irt_3pl_probability(theta, a, b, c) for theta in abilities])
    rmse = float(np.sqrt(np.mean((correct - predicted) ** 2)))

    return CalibrationResult(
        question_id=request.question_id,
        discrimination=round(a, 3),
        difficulty=round(b, 3),
        guessing=round(c, 3),
        sample_size=len(responses),
        fit_rmse=round(rmse, 4),
    )


@router.post("/estimate-ability", response_model=AbilityEstimationResult)
async def estimate_ability(request: AbilityEstimationRequest):
    """Estimate student ability using Maximum Likelihood Estimation."""
    if not request.responses:
        return AbilityEstimationResult(ability=0.0, standard_error=1.0)

    def neg_log_likelihood(theta_arr):
        theta = theta_arr[0]
        ll = 0.0
        for r in request.responses:
            a = r.get("discrimination", 1.0)
            b = r.get("difficulty", 0.0)
            c = r.get("guessing", 0.25)
            p = irt_3pl_probability(theta, a, b, c)
            p = max(1e-10, min(1 - 1e-10, p))
            if r["is_correct"]:
                ll += np.log(p)
            else:
                ll += np.log(1 - p)
        return -ll

    result = minimize(
        neg_log_likelihood,
        x0=[0.0],
        method="Nelder-Mead",
    )

    ability = float(np.clip(result.x[0], -3.0, 3.0))

    # Estimate SE using Fisher information
    info = 0.0
    for r in request.responses:
        a = r.get("discrimination", 1.0)
        b = r.get("difficulty", 0.0)
        c = r.get("guessing", 0.25)
        p = irt_3pl_probability(ability, a, b, c)
        p = max(1e-10, min(1 - 1e-10, p))
        q = 1 - p
        info += (a ** 2 * (p - c) ** 2 * q) / ((1 - c) ** 2 * p)

    se = float(1.0 / np.sqrt(max(info, 0.01)))
    se = min(se, 2.0)

    return AbilityEstimationResult(ability=round(ability, 3), standard_error=round(se, 3))
