from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    allergy_profile: Optional[str] = "[]"
    created_at: datetime

    class Config:
        from_attributes = True

class AllergyUpdate(BaseModel):
    allergies: List[str]

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Prescriptions
class PrescriptionResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    image_url: Optional[str] = None
    ocr_confidence: float
    clarity_score: int
    doctor_notes: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    structured_data: Any # Parsed JSON or JSON string
    created_at: datetime

    class Config:
        from_attributes = True

# Medical Reports
class MedicalReportResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_url: Optional[str] = None
    report_type: str
    health_status: str
    raw_text: Optional[str] = None
    structured_data: Any
    created_at: datetime

    class Config:
        from_attributes = True

# Drug Interactions
class InteractionCheckRequest(BaseModel):
    medicines: List[str]

class InteractionCheckResponse(BaseModel):
    result_status: str # Safe, Moderate, High
    explanation: str
    recommendations: List[str]

# Health Summary Request
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None

# Symptom Checker Schemas
class SymptomCheckRequest(BaseModel):
    age: int
    gender: str
    weight: float
    symptoms: str
    duration: str

class SuggestedMedicine(BaseModel):
    name: str
    dosage: str
    frequency: str
    schedule_decoded: Dict[str, str] # e.g. {"morning": "...", "afternoon": "...", "night": "..."}
    purpose: str
    precautions: List[str]

class SymptomCheckResponse(BaseModel):
    severity: str # Mild, Moderate, Severe
    should_see_doctor: bool
    doctor_recommendation_text: str
    advisory_notes: str
    suggested_medicines: List[SuggestedMedicine]

# Expiry Checker Schemas
class ExpiryCheckResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_url: Optional[str] = None
    mfg_date: Optional[str] = None
    exp_date: Optional[str] = None
    is_expired: bool
    days_remaining: Optional[int] = None
    recommendation_text: str
    created_at: datetime

    class Config:
        from_attributes = True

# Medication Reminder Schemas
class ReminderCreate(BaseModel):
    tablet_name: str = Field(..., min_length=1)
    reminder_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    notes: Optional[str] = None

class ReminderUpdate(BaseModel):
    tablet_name: Optional[str] = None
    reminder_time: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    tablet_name: str
    reminder_time: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
