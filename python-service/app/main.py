from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import logging

from app.config import settings
from app.models import TestRequest, TestResponse, StepResult
from app.pdf_processor import PDFProcessor
from app.llm_client import LLMClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vision CAQ - PDF Analysis Service",
    description="AI-powered PDF quality assurance service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pdf_processor = PDFProcessor()
llm_client = LLMClient(
    provider=settings.llm_provider,
    api_key=settings.llm_api_key,
    model=settings.llm_model
)


@app.get("/")
async def root():
    return {
        "service": "Vision CAQ - PDF Analysis Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/analyze", response_model=TestResponse)
async def analyze_pdf(
    file: UploadFile = File(...),
    test_request: str = File(...)  # JSON string
):
    """
    Analyze a PDF document based on the provided test plan steps.

    Args:
        file: PDF file to analyze
        test_request: JSON string containing test plan configuration

    Returns:
        TestResponse with analysis results
    """
    try:
        import json
        request_data = json.loads(test_request)
        test_req = TestRequest(**request_data)

        # Read PDF file
        pdf_content = await file.read()

        # Process PDF
        logger.info(f"Processing PDF: {file.filename}")
        pdf_data = pdf_processor.process_pdf(pdf_content)

        # Perform checks
        results: List[StepResult] = []

        for procedure in test_req.procedures:
            for step in procedure.steps:
                logger.info(f"Executing step: {step.name} ({step.check_type})")

                try:
                    result = await execute_check(
                        step=step,
                        pdf_data=pdf_data,
                        llm_client=llm_client
                    )
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error executing step {step.name}: {str(e)}")
                    results.append(StepResult(
                        step_id=step.step_id,
                        step_name=step.name,
                        result="FAILED",
                        message=f"Fehler bei der Ausführung: {str(e)}",
                        details={}
                    ))

        # Determine overall result
        overall_result = "PASSED"
        if any(r.result == "FAILED" and r.required for r in results):
            overall_result = "FAILED"
        elif any(r.result == "WARNING" for r in results):
            overall_result = "WARNING"

        return TestResponse(
            overall_result=overall_result,
            step_results=results,
            summary=generate_summary(results)
        )

    except Exception as e:
        logger.error(f"Error analyzing PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def execute_check(
    step: Any,
    pdf_data: Dict[str, Any],
    llm_client: LLMClient
) -> StepResult:
    """Execute a single check step"""

    check_type = step.check_type

    # Build prompt based on check type
    if check_type == "PRESENCE":
        prompt = f"""Prüfe, ob folgendes Element im Dokument vorhanden ist:
{step.description}

Parameter: {step.parameters}

Analysiere das Dokument und gib an, ob das Element vorhanden ist."""

    elif check_type == "FIELD_VALUE":
        prompt = f"""Prüfe den Wert des folgenden Feldes im Dokument:
{step.description}

Erwartete Kriterien: {step.parameters}

Extrahiere den Wert und validiere ihn gegen die Kriterien."""

    elif check_type == "LEGAL_REQUIREMENT":
        prompt = f"""Prüfe, ob folgende gesetzliche Vorgabe erfüllt ist:
{step.description}

Anforderungen: {step.parameters}

Analysiere das Dokument auf Einhaltung der Vorgabe."""

    elif check_type == "DIN_STANDARD":
        prompt = f"""Prüfe, ob folgende DIN-Norm eingehalten wird:
{step.description}

Norm-Anforderungen: {step.parameters}

Überprüfe das Dokument gegen diese Norm."""

    elif check_type == "IMAGE_QUALITY":
        prompt = f"""Prüfe die Bildqualität des Dokuments:
{step.description}

Qualitätskriterien: {step.parameters}

Bewerte Auflösung, Lesbarkeit und allgemeine Qualität."""

    elif check_type == "TEXT_EXTRACTION":
        prompt = f"""Extrahiere und validiere folgenden Text:
{step.description}

Validierungskriterien: {step.parameters}

Extrahiere den Text und prüfe die Kriterien."""

    else:  # CUSTOM
        prompt = f"""Führe folgende benutzerdefinierte Prüfung durch:
{step.description}

Parameter: {step.parameters}"""

    # Add document context
    full_prompt = f"""{prompt}

Dokumentinformationen:
- Seitenanzahl: {pdf_data['num_pages']}
- Extrahierter Text: {pdf_data['text'][:1000]}...

Antworte im folgenden JSON-Format:
{{
    "result": "PASSED" oder "FAILED" oder "WARNING",
    "message": "Kurze Zusammenfassung des Ergebnisses",
    "details": {{
        "found": true/false,
        "value": "gefundener Wert falls zutreffend",
        "confidence": 0.0-1.0
    }}
}}"""

    # Call LLM
    try:
        response = await llm_client.analyze(
            prompt=full_prompt,
            images=pdf_data.get('images', [])[:3]  # First 3 pages as images
        )

        # Parse response
        import json
        result_data = json.loads(response)

        return StepResult(
            step_id=step.step_id,
            step_name=step.name,
            result=result_data.get("result", "FAILED"),
            message=result_data.get("message", ""),
            details=result_data.get("details", {}),
            required=step.required
        )

    except Exception as e:
        logger.error(f"LLM analysis error: {str(e)}")
        return StepResult(
            step_id=step.step_id,
            step_name=step.name,
            result="FAILED",
            message=f"Analyse fehlgeschlagen: {str(e)}",
            details={},
            required=step.required
        )


def generate_summary(results: List[StepResult]) -> str:
    """Generate a summary of test results"""
    total = len(results)
    passed = sum(1 for r in results if r.result == "PASSED")
    failed = sum(1 for r in results if r.result == "FAILED")
    warnings = sum(1 for r in results if r.result == "WARNING")

    return f"""Prüfung abgeschlossen: {passed}/{total} Schritte erfolgreich.
Fehlgeschlagen: {failed}, Warnungen: {warnings}"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
