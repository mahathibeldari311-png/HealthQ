import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, MedicationReminder
from app.schemas import ReminderCreate, ReminderUpdate, ReminderResponse
from app.auth_helpers import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reminders", tags=["Medication Reminders"])

@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_reminder = MedicationReminder(
            user_id=current_user.id,
            tablet_name=reminder_data.tablet_name,
            reminder_time=reminder_data.reminder_time,
            notes=reminder_data.notes,
            is_active=True
        )
        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)
        return new_reminder
    except Exception as e:
        logger.error(f"Failed to create medication reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save reminder to database."
        )

@router.get("", response_model=list[ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        records = db.query(MedicationReminder).filter(MedicationReminder.user_id == current_user.id).order_by(MedicationReminder.reminder_time.asc()).all()
        return records
    except Exception as e:
        logger.error(f"Failed to fetch reminders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reminders."
        )

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    update_data: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id, MedicationReminder.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    try:
        if update_data.tablet_name is not None:
            r.tablet_name = update_data.tablet_name
        if update_data.reminder_time is not None:
            r.reminder_time = update_data.reminder_time
        if update_data.notes is not None:
            r.notes = update_data.notes
        if update_data.is_active is not None:
            r.is_active = update_data.is_active
            
        db.commit()
        db.refresh(r)
        return r
    except Exception as e:
        logger.error(f"Failed to update reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reminder."
        )

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(MedicationReminder).filter(MedicationReminder.id == reminder_id, MedicationReminder.user_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    try:
        db.delete(r)
        db.commit()
        return
    except Exception as e:
        logger.error(f"Failed to delete reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete reminder from database."
        )
