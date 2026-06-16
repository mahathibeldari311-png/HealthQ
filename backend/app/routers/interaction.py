import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, InteractionHistory
from app.schemas import InteractionCheckRequest, InteractionCheckResponse, SymptomCheckRequest, SymptomCheckResponse
from app.auth_helpers import get_current_user
from app.ai_service import check_drug_interactions, suggest_medicines_from_symptoms

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/interactions", tags=["Drug Interactions"])

@router.post("/check", response_model=InteractionCheckResponse)
def check_interactions(
    request: InteractionCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(request.medicines) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 medicines are required to check for interactions."
        )

    try:
        # Perform check via AI service
        analysis = check_drug_interactions(request.medicines)
    except Exception as e:
        logger.error(f"Interaction check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check interactions: {e}"
        )

    # Save to history
    try:
        history_record = InteractionHistory(
            user_id=current_user.id,
            medicines=json.dumps(request.medicines),
            result_status=analysis.get("result_status", "Safe"),
            explanation=analysis.get("explanation", "")
        )
        db.add(history_record)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to save interaction history: {e}")
        # We don't fail the request if saving history fails, just log it

    return {
        "result_status": analysis.get("result_status", "Safe"),
        "explanation": analysis.get("explanation", ""),
        "recommendations": analysis.get("recommendations", [])
    }

@router.get("/history")
def get_interaction_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(InteractionHistory).filter(InteractionHistory.user_id == current_user.id).order_by(InteractionHistory.created_at.desc()).limit(20).all()
    results = []
    for r in records:
        try:
            meds = json.loads(r.medicines or "[]")
        except Exception:
            meds = []
        results.append({
            "id": r.id,
            "medicines": meds,
            "result_status": r.result_status,
            "explanation": r.explanation,
            "created_at": r.created_at
        })
    return results

@router.post("/symptom-check", response_model=SymptomCheckResponse)
def check_symptoms(
    request: SymptomCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        analysis = suggest_medicines_from_symptoms(
            age=request.age,
            gender=request.gender,
            weight=request.weight,
            symptoms=request.symptoms,
            duration=request.duration
        )
        return analysis
    except Exception as e:
        logger.error(f"Symptom check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze symptoms: {e}"
        )
