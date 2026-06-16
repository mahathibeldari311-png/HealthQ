import os
import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Prescription
from app.schemas import PrescriptionResponse
from app.auth_helpers import get_current_user
from app.ocr_service import extract_text_from_image
from app.ai_service import analyze_prescription
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])

@router.post("/upload", response_model=PrescriptionResponse)
async def upload_prescription(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename to prevent collision
    file_ext = os.path.splitext(file.filename)[1]
    if file_ext.lower() not in [".jpg", ".jpeg", ".png", ".pdf", ".webp", ".jfif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only JPG, JPEG, PNG, PDF, WEBP, and JFIF are allowed."
        )
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file locally
    try:
        with open(file_path, "wb") as buffer:
            shutil_content = await file.read()
            buffer.write(shutil_content)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file to disk."
        )

    # Execute OCR to extract raw text
    try:
        # Note: If it's a PDF, we can either extract text directly or convert to image.
        # For simplicity, we assume image uploads or fallback to text if simple text PDF.
        raw_ocr_text, ocr_conf = extract_text_from_image(file_path, original_filename=file.filename)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raw_ocr_text = "Failed to run OCR scanner."
        ocr_conf = 50.0

    # Parse allergy profile of user
    try:
        user_allergies = json.loads(current_user.allergy_profile or "[]")
    except Exception:
        user_allergies = []

    # Run AI prescription interpretation
    try:
        analysis = analyze_prescription(file_path, raw_ocr_text, user_allergies)
    except Exception as e:
        logger.error(f"AI Prescription Analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Analysis failed: {str(e)}"
        )

    # Save to database
    prescription_record = Prescription(
        user_id=current_user.id,
        filename=file.filename,
        image_url=f"/static/uploads/{unique_filename}", # Server static path representation
        ocr_confidence=ocr_conf,
        clarity_score=analysis.get("clarity_score", 100),
        doctor_notes=analysis.get("doctor_notes", "None"),
        raw_ocr_text=raw_ocr_text,
        structured_data=json.dumps(analysis)
    )
    
    db.add(prescription_record)
    db.commit()
    db.refresh(prescription_record)

    # Prepare response
    res = prescription_record
    # Parse structured_data string back to JSON object for response serializing
    response_data = {
        "id": res.id,
        "user_id": res.user_id,
        "filename": res.filename,
        "image_url": res.image_url,
        "ocr_confidence": res.ocr_confidence,
        "clarity_score": res.clarity_score,
        "doctor_notes": res.doctor_notes,
        "raw_ocr_text": res.raw_ocr_text,
        "structured_data": analysis,
        "created_at": res.created_at
    }
    return response_data

@router.get("", response_model=list[PrescriptionResponse])
def get_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(Prescription).filter(Prescription.user_id == current_user.id).order_by(Prescription.created_at.desc()).all()
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
            "image_url": r.image_url,
            "ocr_confidence": r.ocr_confidence,
            "clarity_score": r.clarity_score,
            "doctor_notes": r.doctor_notes,
            "raw_ocr_text": r.raw_ocr_text,
            "structured_data": struct_data,
            "created_at": r.created_at
        })
    return results

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(Prescription).filter(Prescription.id == prescription_id, Prescription.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    try:
        struct_data = json.loads(r.structured_data or "{}")
    except Exception:
        struct_data = {}
        
    return {
        "id": r.id,
        "user_id": r.user_id,
        "filename": r.filename,
        "image_url": r.image_url,
        "ocr_confidence": r.ocr_confidence,
        "clarity_score": r.clarity_score,
        "doctor_notes": r.doctor_notes,
        "raw_ocr_text": r.raw_ocr_text,
        "structured_data": struct_data,
        "created_at": r.created_at
    }

@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(Prescription).filter(Prescription.id == prescription_id, Prescription.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    db.delete(r)
    db.commit()
    return
