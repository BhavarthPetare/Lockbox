# Lockbox Backend

Secure healthcare file storage backend built with FastAPI, Appwrite, AES, RSA, and a local blockchain audit log.

## Features

- Hybrid encryption for files (AES for content, RSA for AES key wrapping)
- Appwrite Storage integration for encrypted file package persistence
- Blockchain-like append-only audit trail for uploads
- Basic user route scaffolding

## Project Structure

- `backend/app/api/v1`: HTTP routes
- `backend/app/services`: business logic
- `backend/app/utils`: crypto and helpers
- `backend/app/core`: app configuration and Appwrite client
- `backend/scripts`: utility scripts
- `backend/tests`: pytest test suite

## Local Setup

1. Create a virtual environment and install dependencies:
```bash
pip install -r backend/requirements.txt
```
2. Copy env template:
```bash
cp backend/.env.example backend/.env
```
3. Fill Appwrite credentials in `backend/.env`.
4. Generate RSA keys:
```bash
python -m backend.scripts.generate_rsa_keys
```
5. Run API:
```bash
uvicorn backend.app.main:app --reload
```

## Security Notes

- Do not commit `backend/.env` or private keys.
- Rotate any Appwrite API key that was previously committed.
