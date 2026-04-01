import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from models import AuditBlock
import uuid
from typing import cast

def calculate_sha512(index: int, timestamp: str, action: str, file_id: str, user_id: str, previous_hash: str) -> str:
    # Concatenate all block data into a single string
    data_string = f"{index}{timestamp}{action}{file_id}{user_id}{previous_hash}"
    # Generate the SHA-512 hash
    return hashlib.sha512(data_string.encode('utf-8')).hexdigest()

def record_audit_event(db: Session, action: str, file_id: str, user_id: str):
    # 1. Get the most recent block to find the previous hash
    last_block = db.query(AuditBlock).order_by(AuditBlock.index.desc()).first()

    if last_block:
        new_index = cast(int, last_block.index) + 1
        previous_hash = cast(str, last_block.block_hash)
    else:
        # Genesis Block (the very first event in the system)
        new_index = 0
        previous_hash = "0" * 128 # 128 zeros for an empty SHA-512 hash

    timestamp = datetime.utcnow()
    
    # 2. Calculate the new hash
    block_hash = calculate_sha512(
        index=new_index,
        timestamp=timestamp.isoformat(),
        action=action,
        file_id=file_id,
        user_id=user_id,
        previous_hash=previous_hash
    )

    # 3. Save the new block to the database
    new_block = AuditBlock(
        index=new_index,
        timestamp=timestamp,
        action=action,
        file_id=uuid.UUID(file_id),
        user_id=uuid.UUID(user_id),
        previous_hash=previous_hash,
        block_hash=block_hash
    )

    db.add(new_block)
    db.commit()
    
    return new_block