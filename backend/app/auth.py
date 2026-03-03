from jose import jwt
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def verify_user(token: str):
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated") # type: ignore
        return {
            "user_id": payload.get("sub"),
            "role": payload.get("role")
        }
    except Exception as e:
        print("Error:", e)
        return None