from passlib.context import CryptContext
from jose import jwt
import hashlib

SECRET_KEY = "supersecret"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    password = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password)

def verify_password(password: str, hashed):
    password = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.verify(password, hashed)

def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])