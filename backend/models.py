from sqlalchemy import Column, String, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True)
    password_hash = Column(String)
    role = Column(String)
    hospital_id = Column(String, nullable=True)
    public_key = Column(String)
    encrypted_private_key = Column(String, nullable=True)
    private_key_iv = Column(String, nullable=True)


class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True))
    hospital_id = Column(String)
    file_url = Column(String)
    iv = Column(String)
    uploaded_by = Column(UUID(as_uuid=True))
    file_name = Column(String)
    file_type = Column(String)


class FileKey(Base):
    __tablename__ = "file_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    encrypted_key = Column(String)


class PatientNurseMap(Base):
    __tablename__ = "patient_nurse_map"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True))
    nurse_id = Column(UUID(as_uuid=True))

class AuditBlock(Base):
    __tablename__ = "audit_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    index = Column(Integer, unique=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # What happened, to which file, and by whom?
    action = Column(String) # e.g., "UPLOAD", "ACCESS"
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # The Blockchain Links
    previous_hash = Column(String)
    block_hash = Column(String)