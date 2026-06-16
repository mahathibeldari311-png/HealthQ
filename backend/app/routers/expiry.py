import os
import uuid
import json
import shutil
import logging
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, TabletExpiryLog
from app.schemas import ExpiryCheckResponse
from app.auth_helpers import get_current_user
from app.ocr_service import extract_text_from_image
from app.ai_service import analyze_tablet_expiry
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/expiry", tags=["Tablet Expiry Checker"])

@router.post("/scan", response_model=ExpiryCheckResponse)
async def scan_tablet_expiry(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1]
    if file_ext.lower() not in [".jpg", ".jpeg", ".png", ".webp", ".jfif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPG, JPEG, PNG, WEBP, and JFIF are allowed."
        )
        
    unique_filename = f"expiry_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save image file
    try:
        with open(file_path, "wb") as buffer:
            shutil_content = await file.read()
            buffer.write(shutil_content)
    except Exception as e:
        logger.error(f"Failed to save tablet image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file to disk."
        )

    # Run OCR scanner
    try:
        raw_text, ocr_conf = extract_text_from_image(file_path, original_filename=file.filename)
    except Exception as e:
        logger.error(f"Tablet OCR failed: {e}")
        raw_text = "Failed to run OCR scanner."

    # Interpret expiry using AI/Vision service
    try:
        analysis = analyze_tablet_expiry(file_path, raw_text)
    except Exception as e:
        logger.error(f"AI Tablet Expiry analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Expiry check analysis failed: {str(e)}"
        )

    # Save to db
    try:
        log_record = TabletExpiryLog(
            user_id=current_user.id,
            filename=file.filename,
            file_url=f"/static/uploads/{unique_filename}",
            mfg_date=analysis.get("mfg_date"),
            exp_date=analysis.get("exp_date"),
            is_expired=analysis.get("is_expired", False),
            days_remaining=analysis.get("days_remaining"),
            recommendation_text=analysis.get("recommendation_text", "")
        )
        db.add(log_record)
        db.commit()
        db.refresh(log_record)
    except Exception as e:
        logger.error(f"Failed to write expiry log record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database write operation failed."
        )

    return log_record

@router.get("", response_model=list[ExpiryCheckResponse])
def get_expiry_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(TabletExpiryLog).filter(TabletExpiryLog.user_id == current_user.id).order_by(TabletExpiryLog.created_at.desc()).all()
    return records

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expiry_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(TabletExpiryLog).filter(TabletExpiryLog.id == log_id, TabletExpiryLog.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Expiry log not found")
        
    db.delete(r)
    db.commit()
    return
