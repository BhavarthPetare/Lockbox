'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deriveKeyFromPassword, decryptPrivateKeyWithPassword } from '@/lib/crypto'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      }
    )

    if (!res.ok) {
      setError('Invalid credentials')
      return
    }

    const data = await res.json()

    if (data.encrypted_private_key && data.private_key_iv) {
      try {
        const passwordKey = await deriveKeyFromPassword(password, email)
        const decryptedPrivateKey = await decryptPrivateKeyWithPassword(
          data.encrypted_private_key,
          data.private_key_iv,
          passwordKey
        )
        localStorage.setItem('privateKey', decryptedPrivateKey)
      } catch (err) {
        console.error("Failed to unlock private key. Password might be wrong.", err)
      }
    }
    console.log("Login role:", data.role)

    router.push(`/dashboard/${data.role}/dashboard`)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form
        onSubmit={handleLogin}
        className="bg-slate-900 p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-white mb-6">Login</h1>

        <input
          type="email"
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

        {error && <p className="text-red-400 mb-3">{error}</p>}

        <button
          className="w-full bg-blue-600 py-3 rounded-lg hover:bg-blue-700"
          type='submit'
        >
          Login
        </button>

        <p className="text-slate-400 mt-4 text-sm">
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-400">
            Signup
          </a>
        </p>
      </form>
    </div>
  )
}