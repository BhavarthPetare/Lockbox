from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, File as FileModel, FileKey, PatientNurseMap, AuditBlock
from utils.security import decode_token
from utils.blockchain import record_audit_event

import uuid
import os
import json

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------- DB Dependency ---------------- #
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- Helper: Get Current User ---------------- #
def get_current_user(request: Request, db: Session) -> User:
    token = request.cookies.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="No token")

    try:
        data = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = uuid.UUID(data["id"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@router.get("/list")
def list_files(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    files = db.query(FileModel).filter(
        FileModel.patient_id == current_user.id
    ).all()

    return [{"id": str(f.id), "file_name":f.file_name} for f in files]

# ---------------- 1. Get Authorized Users ---------------- #
@router.get("/authorized-users")
def get_authorized_users(
    patient_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)

    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        patient_uuid = uuid.UUID(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient id")

    patient = db.query(User).filter(User.id == patient_uuid).first()

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    users = []

    # Patient
    users.append({
        "user_id": str(patient.id),
        "public_key": patient.public_key
    })

    # Doctors in same hospital
    doctors = db.query(User).filter(
        User.role == "doctor",
        User.hospital_id == patient.hospital_id
    ).all()

    for d in doctors:
        users.append({
            "user_id": str(d.id),
            "public_key": d.public_key
        })

    # Nurses assigned
    mappings = db.query(PatientNurseMap).filter(
        PatientNurseMap.patient_id == patient.id
    ).all()

    nurse_ids = [m.nurse_id for m in mappings]

    if nurse_ids:
        nurses = db.query(User).filter(User.id.in_(nurse_ids)).all()
        for n in nurses:
            users.append({
                "user_id": str(n.id),
                "public_key": n.public_key
            })

    return users


# ---------------- 2. Upload File ---------------- #
@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    iv: str = Form(...),
    keys: str = Form(...),
    patient_id: str = Form(...),
    file_name: str = Form(...),
    file_type: str = Form(...),
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, db)

    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        patient_uuid = uuid.UUID(patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid patient id")

    patient = db.query(User).filter(User.id == patient_uuid).first()

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Save file
    file_id = uuid.uuid4()
    file_path = os.path.join(UPLOAD_DIR, str(file_id))

    with open(file_path, "wb") as f:
        f.write(await file.read())

    new_file = FileModel(
        id=file_id,
        patient_id=patient.id,
        hospital_id=patient.hospital_id,
        file_url=f"http://localhost:8000/uploads/{file_id}",
        iv=iv,
        uploaded_by=current_user.id,
        file_name=file_name,
        file_type=file_type
    )

    db.add(new_file)

    try:
        key_list = json.loads(keys)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid keys format")

    for k in key_list:
        db.add(FileKey(
            file_id=file_id,
            user_id=uuid.UUID(k["user_id"]),
            encrypted_key=k["key"]
        ))

    db.commit()

    record_audit_event(
        db=db,
        action="UPLOAD",
        file_id=str(file_id),
        user_id=str(current_user.id)
    )

    return {"message": "uploaded", "file_id": str(file_id)}


# ---------------- 3. Get File (Secure Access) ---------------- #
@router.get("/{file_id}")
def get_file(file_id: str, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    try:
        file_uuid = uuid.UUID(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")

    file_obj = db.query(FileModel).filter(FileModel.id == file_uuid).first()

    if file_obj is None:
        raise HTTPException(status_code=404, detail="File not found")

    allowed = False

    # Patient
    if current_user.role == "patient": # pyright: ignore[reportGeneralTypeIssues]
        if str(current_user.id) == str(file_obj.patient_id):
            allowed = True

    # Doctor
    elif current_user.role == "doctor": # pyright: ignore[reportGeneralTypeIssues]
        if current_user.hospital_id == file_obj.hospital_id: # pyright: ignore[reportGeneralTypeIssues]
            allowed = True

    # Nurse
    elif current_user.role == "nurse": # pyright: ignore[reportGeneralTypeIssues]
        mapping = db.query(PatientNurseMap).filter(
            PatientNurseMap.patient_id == file_obj.patient_id,
            PatientNurseMap.nurse_id == current_user.id
        ).first()

        if mapping is not None:
            allowed = True

    # Admin
    elif current_user.role == "admin": # pyright: ignore[reportGeneralTypeIssues]
        allowed = True

    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")

    file_key = db.query(FileKey).filter(
        FileKey.file_id == file_obj.id,
        FileKey.user_id == current_user.id
    ).first()

    if file_key is None:
        raise HTTPException(status_code=403, detail="No key for user")
    
    record_audit_event(
        db=db,
        action="ACCESS",
        file_id=str(file_obj.id),
        user_id=str(current_user.id)
    )
    return {
        "file_url": file_obj.file_url,
        "iv": file_obj.iv,
        "encrypted_key": file_key.encrypted_key,
        "file_name": file_obj.file_name,
        "file_type": file_obj.file_type
    }

@router.get("/{file_id}/audit")
def get_file_audit_trail(file_id: str, request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    # Restrict audit logs to doctors and admins
    if current_user.role not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")

    try:
        file_uuid = uuid.UUID(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file id")

    # Fetch all blocks related to this file, ordered sequentially
    blocks = db.query(AuditBlock).filter(AuditBlock.file_id == file_uuid).order_by(AuditBlock.index.asc()).all()

    return [
        {
            "index": b.index,
            "timestamp": b.timestamp,
            "action": b.action,
            "user_id": str(b.user_id),
            "block_hash": b.block_hash,
            "previous_hash": b.previous_hash
        }
        for b in blocks
    ]