import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserResponse, AllergyUpdate, ProfileUpdate
from app.auth_helpers import get_current_user

router = APIRouter(prefix="/api/profile", tags=["User Profile"])

@router.put("/allergies", response_model=UserResponse)
def update_allergies(
    allergy_data: AllergyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        current_user.allergy_profile = json.dumps(allergy_data.allergies)
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save allergy profile: {e}"
        )
    return current_user

@router.put("", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if profile_data.full_name is not None:
            current_user.full_name = profile_data.full_name
        if profile_data.avatar is not None:
            current_user.avatar = profile_data.avatar
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update profile: {e}"
        )
    return current_user
