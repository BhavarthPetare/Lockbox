# 🏥 Lockbox: E2EE Medical Record System

Lockbox is a secure, End-to-End Encrypted (E2EE) medical record storage system designed to protect patient privacy. It ensures that only authorized medical personnel can access patient reports, backed by a tamper-proof cryptographic audit trail.

## ✨ Core Features

* **End-to-End Encryption (E2EE):** Files are encrypted symmetrically on the client-side using AES-GCM (256-bit). The AES keys are then asymmetrically wrapped using RSA-OAEP (2048-bit) public keys.
* **Zero-Knowledge Architecture:** The server never sees the unencrypted files or the raw private keys. User private keys are encrypted locally using a password-derived AES key (PBKDF2) before being stored in the database.
* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Patients, Doctors, Nurses, and Admins.
* **Blockchain Audit Trail:** Every file upload and access event is permanently recorded in a sequential database ledger, chained together using SHA-512 hashing to prevent tampering.

## 🛠️ Tech Stack

**Frontend**

* Framework: Next.js (React)
* Styling: Tailwind CSS
* Cryptography: Web Crypto API

**Backend**

* Framework: FastAPI (Python)
* Database: PostgreSQL
* ORM: SQLAlchemy
* Authentication: JWT (JSON Web Tokens) & bcrypt

## 🔐 Cryptographic Flow

1. **Signup:** Client generates an RSA key pair. The private key is encrypted using a hash of the user's password before transmission.
2. **Login:** Client retrieves the encrypted private key and decrypts it locally using their password.
3. **Upload:** Client generates a one-time AES key, encrypts the file, and then encrypts that AES key with the RSA public keys of all globally authorized doctors.
4. **Download:** Client retrieves the encrypted file and their specific encrypted AES key, unlocks the AES key using their local RSA private key, and decrypts the file in the browser.

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Python (3.9+)
* PostgreSQL running locally on port `5432`

### Backend Setup

1. Open a terminal and navigate to the backend directory.
2. Create and activate a virtual environment:
   `python -m venv venv`
   `source venv/bin/activate`  *(On Windows: `venv\Scripts\activate`)*
3. Install dependencies:
   `pip install fastapi uvicorn sqlalchemy psycopg2-binary passlib bcrypt python-jose python-multipart`
4. Create a PostgreSQL database named `lockbox_db` (username/password: `postgres`/`postgres`).
5. Initialize the database tables:
   `python reset_db.py`
6. Start the FastAPI server:
   `uvicorn main:app --reload`
   *The backend will run on `http://localhost:8000`*

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory.
2. Install dependencies:
   `npm install`
3. Create a `.env.local` file in the root of the frontend and add your API URL:
   `NEXT_PUBLIC_API_URL=http://localhost:8000`
4. Start the development server:
   `npm run dev`
   *The frontend will run on `http://localhost:3000`*

## ⚠️ Security Notice

This is a prototype/demonstration of an E2EE application. Before deploying to production, ensure that you transition all environment variables to a secure vault, enforce HTTPS/WSS across all connections to prevent MITM attacks, and undergo a professional security audit.