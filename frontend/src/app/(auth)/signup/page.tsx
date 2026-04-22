'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateRSAKeyPair, bufferToBase64, deriveKeyFromPassword, encryptPrivateKeyWithPassword } from '@/lib/crypto'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [hospitalId, setHospitalId] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    const keyPair = await generateRSAKeyPair()

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKeyBase64 = bufferToBase64(publicKeyBuffer)
    const privateKeyBase64 = bufferToBase64(privateKeyBuffer)

    const passwordKey = await deriveKeyFromPassword(password, email)
    const {encryptedKey, iv} = await encryptPrivateKeyWithPassword(privateKeyBase64, passwordKey)

    localStorage.setItem('privateKey', privateKeyBase64)

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role,
        hospital_id: role === 'patient' ? null : hospitalId,
        public_key: publicKeyBase64,
        encrypted_private_key: encryptedKey,
        private_key_iv: iv
      })
    })

    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={handleSignup}
        className="bg-slate-900 p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Signup</h1>

        <input
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 text-white"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 text-white"
          onChange={e => setPassword(e.target.value)}
        />

        <select
          title='role'
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 text-white"
          onChange={e => setRole(e.target.value)}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
        </select>

        {role !== 'patient' && (
          <input
            placeholder="Hospital ID"
            className="w-full mb-4 p-3 rounded-lg bg-slate-800 text-white"
            onChange={e => setHospitalId(e.target.value)}
          />
        )}

        <button className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-700">
          Signup
        </button>
      </form>
    </div>
  )
}