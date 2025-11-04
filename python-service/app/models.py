from pydantic import BaseModel
from typing import List, Dict, Any, Literal, Optional


class ProcedureStep(BaseModel):
    step_id: str
    name: str
    description: str
    check_type: Literal[
        "PRESENCE",
        "FIELD_VALUE",
        "LEGAL_REQUIREMENT",
        "DIN_STANDARD",
        "IMAGE_QUALITY",
        "TEXT_EXTRACTION",
        "CUSTOM"
    ]
    parameters: Dict[str, Any]
    required: bool = True


class Procedure(BaseModel):
    procedure_id: str
    name: str
    steps: List[ProcedureStep]


class TestRequest(BaseModel):
    test_plan_id: str
    test_plan_name: str
    document_category: Literal["TECHNICAL_DRAWING", "LABEL", "INVOICE"]
    procedures: List[Procedure]


class StepResult(BaseModel):
    step_id: str
    step_name: str
    result: Literal["PASSED", "FAILED", "WARNING", "NOT_APPLICABLE"]
    message: str
    details: Dict[str, Any]
    required: bool = True


class TestResponse(BaseModel):
    overall_result: Literal["PASSED", "FAILED", "WARNING"]
    step_results: List[StepResult]
    summary: str
