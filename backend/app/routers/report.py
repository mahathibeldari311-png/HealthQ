import os
import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, MedicalReport
from app.schemas import MedicalReportResponse
from app.auth_helpers import get_current_user
from app.ocr_service import extract_text_from_image
from app.ai_service import analyze_medical_report
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Medical Reports"])

@router.post("/upload", response_model=MedicalReportResponse)
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Validate extension
    file_ext = os.path.splitext(file.filename)[1]
    if file_ext.lower() not in [".jpg", ".jpeg", ".png", ".pdf", ".webp", ".jfif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only JPG, JPEG, PNG, PDF, WEBP, and JFIF are allowed."
        )
        
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil_content = await file.read()
            buffer.write(shutil_content)
    except Exception as e:
        logger.error(f"Failed to save report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file to disk."
        )

    # Run OCR scanner
    try:
        raw_text, ocr_conf = extract_text_from_image(file_path, original_filename=file.filename)
    except Exception as e:
        logger.error(f"Report OCR failed: {e}")
        raw_text = "Failed to run OCR scanner."
        ocr_conf = 50.0

    # Interpret reports using AI service
    try:
        analysis = analyze_medical_report(file_path, raw_text)
    except Exception as e:
        logger.error(f"AI Report analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report analysis failed: {str(e)}"
        )

    # Save to db
    report_record = MedicalReport(
        user_id=current_user.id,
        filename=file.filename,
        file_url=f"/static/uploads/{unique_filename}",
        report_type=analysis.get("report_type", "General Panel"),
        health_status=analysis.get("health_status", "🟢 Within expected range"),
        raw_text=raw_text,
        structured_data=json.dumps(analysis)
    )
    
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return {
        "id": report_record.id,
        "user_id": report_record.user_id,
        "filename": report_record.filename,
        "file_url": report_record.file_url,
        "report_type": report_record.report_type,
        "health_status": report_record.health_status,
        "raw_text": report_record.raw_text,
        "structured_data": analysis,
        "created_at": report_record.created_at
    }

@router.get("", response_model=list[MedicalReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).all()
    results = []
    for r in records:
        try:
            struct_data = json.loads(r.structured_data or "{}")
        except Exception:
            struct_data = {}
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "filename": r.filename,
            "file_url": r.file_url,
            "report_type": r.report_type,
            "health_status": r.health_status,
            "raw_text": r.raw_text,
            "structured_data": struct_data,
            "created_at": r.created_at
        })
    return results

@router.get("/{report_id}", response_model=MedicalReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(MedicalReport).filter(MedicalReport.id == report_id, MedicalReport.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Medical report not found")
        
    try:
        struct_data = json.loads(r.structured_data or "{}")
    except Exception:
        struct_data = {}
        
    return {
        "id": r.id,
        "user_id": r.user_id,
        "filename": r.filename,
        "file_url": r.file_url,
        "report_type": r.report_type,
        "health_status": r.health_status,
        "raw_text": r.raw_text,
        "structured_data": struct_data,
        "created_at": r.created_at
    }

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(MedicalReport).filter(MedicalReport.id == report_id, MedicalReport.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Medical report not found")
        
    db.delete(r)
    db.commit()
    return
