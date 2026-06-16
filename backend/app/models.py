import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True) # Nullable to support Firebase auth later
    full_name = Column(String(255), nullable=True)
    avatar = Column(String(255), nullable=True)
    allergy_profile = Column(Text, nullable=True, default="[]") # JSON list of allergens
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("MedicalReport", back_populates="user", cascade="all, delete-orphan")
    interactions = relationship("InteractionHistory", back_populates="user", cascade="all, delete-orphan")
    expiry_logs = relationship("TabletExpiryLog", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("MedicationReminder", back_populates="user", cascade="all, delete-orphan")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    image_url = Column(String(500), nullable=True)
    ocr_confidence = Column(Float, default=100.0)
    clarity_score = Column(Integer, default=100)
    doctor_notes = Column(Text, nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    structured_data = Column(Text, nullable=True, default="{}") # JSON string of parsed prescription info
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="prescriptions")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=True)
    report_type = Column(String(100), nullable=False, default="General")
    health_status = Column(String(50), nullable=False, default="🟢 Within expected range") # green, yellow, red status
    raw_text = Column(Text, nullable=True)
    structured_data = Column(Text, nullable=True, default="{}") # JSON string of values, explanations, tips
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")

class InteractionHistory(Base):
    __tablename__ = "interaction_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicines = Column(Text, nullable=False) # Comma-separated or JSON list of medicines
    result_status = Column(String(50), nullable=False) # Safe, Moderate, High
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="interactions")

class TabletExpiryLog(Base):
    __tablename__ = "tablet_expiry_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=True)
    mfg_date = Column(String(100), nullable=True)
    exp_date = Column(String(100), nullable=True)
    is_expired = Column(Boolean, default=False)
    days_remaining = Column(Integer, nullable=True)
    recommendation_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="expiry_logs")

class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tablet_name = Column(String(255), nullable=False)
    reminder_time = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reminders")
