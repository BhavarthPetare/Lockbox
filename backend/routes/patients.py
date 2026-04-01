from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from routes.files import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/list")
def list_patients(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403)

    patients = db.query(User).filter(
        User.role == "patient"
    ).all()

    return [{"id": str(p.id), "email": p.email} for p in patients]
