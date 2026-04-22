import { jwtVerify } from 'jose'

type JWTPayload = {
    id: string
    role: 'patient' | 'doctor' | 'nurse' | 'admin'
    email: string
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret"
)

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as JWTPayload
}