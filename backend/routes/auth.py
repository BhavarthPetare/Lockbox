from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from utils.security import hash_password, verify_password, create_token, decode_token
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/signup")
def signup(data: dict, db: Session = Depends(get_db)):
    user = User(
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data["role"],
        hospital_id=data.get("hospital_id"),
        public_key=data["public_key"],
        encrypted_private_key=data.get("encrypted_private_key"),
        private_key_iv=data.get("private_key_iv")
    )

    db.add(user)
    db.commit()

    return {"message": "User created"}


@router.post("/login")
def login(data: dict, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data["email"]).first()

    if not user or not verify_password(data["password"], user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "id": str(user.id),
        "role": user.role,
        "email": user.email
    })

    response.set_cookie(key="token", value=token, httponly=True)

    return {
        "role": user.role,
        "encrypted_private_key": user.encrypted_private_key,
        "private_key_iv": user.private_key_iv
    }


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401)

    try:
        data = decode_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid Token")
    user = db.query(User).filter(User.id == uuid.UUID(data["id"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role
    }