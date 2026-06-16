import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, prescription, report, profile, interaction, expiry, reminders

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Seed demo user
def seed_demo_user():
    from app.database import SessionLocal
    from app.models import User
    from app.auth_helpers import get_password_hash
    db = SessionLocal()
    try:
        demo = db.query(User).filter(User.email == "demo@healthq.com").first()
        if not demo:
            hashed_pwd = get_password_hash("password123")
            new_user = User(
                email="demo@healthq.com",
                hashed_password=hashed_pwd,
                full_name="Demo Patient",
                allergy_profile="[\"Penicillin\", \"Sulfa drugs\"]"
            )
            db.add(new_user)
            db.commit()
            print("Demo user seeded successfully!")
    except Exception as e:
        print("Failed to seed demo user:", e)
    finally:
        db.close()

seed_demo_user()

app = FastAPI(
    title="HealthQ API",
    description="AI-Powered Smart Prescription and Medical Report Intelligence platform",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.41.11:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if missing
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files to serve uploads
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Routers
app.include_router(auth.router)
app.include_router(prescription.router)
app.include_router(report.router)
app.include_router(profile.router)
app.include_router(interaction.router)
app.include_router(expiry.router)
app.include_router(reminders.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the HealthQ AI-Powered Healthcare Assistant API. Visit /docs for OpenAPI specs."}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "HealthQ API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
