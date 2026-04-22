# Files Uploading

## middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

type JWTPayload = {
  id: string
  role: 'patient' | 'doctor' | 'nurse' | 'admin'
  email: string
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  ) {
    return NextResponse.next()
  }

  // If no token → go to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  let user: JWTPayload

  try {
    user = await verifyToken(token)
  } catch (err) {
    console.error(err)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = user.role

  // Admin can access everything
  if (role === 'admin') {
    return NextResponse.next()
  }

  // Role-based dashboard protection
  if (pathname.startsWith('/dashboard/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/dashboard/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/dashboard/nurse') && role !== 'nurse') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Upload restriction (only doctor + admin)
  if (pathname.startsWith('/upload') && role === 'patient') {
    return NextResponse.redirect(new URL('/dashboard/patient/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload',
    '/file/:path*'
  ]
}

## types/index.ts

export type Patient = {
    id: string
    email: string
}

export type FileItem = {
    id: string
}

## lib/api.ts

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Request failed")
  }

  return res.json()
}

## lib/auth.ts

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

## lib/crypto.ts

// RSA
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
}

// AES
export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptFile(file: File, aesKey: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const buffer = await file.arrayBuffer()

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    buffer
  )

  return { encryptedFile: encrypted, iv }
}

export async function decryptFile(
  encryptedFile: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
) {
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    encryptedFile
  )
}

export async function exportAESKey(aesKey: CryptoKey) {
  return await crypto.subtle.exportKey('raw', aesKey)
}

export async function importAESKey(rawKey: ArrayBuffer) {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
}

export async function importPublicKey(base64Key: string) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}

export async function importPrivateKey(base64Key: string) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  )
}

export async function encryptAESKeyWithRSA(aesKeyRaw: ArrayBuffer, publicKey: CryptoKey) {
  return await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    aesKeyRaw
  )
}

export async function decryptAESKeyWithRSA(encryptedKeyBase64: string, privateKey: CryptoKey) {
  const encrypted = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0))

  return await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encrypted
  )
}

export function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

export function base64ToUint8Array(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

## lib/roles.ts

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ADMIN: 'admin'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

## components/ui/Button.tsx

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Button({ children, ...props }: any) {
  return (
    <button
      {...props}
      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {children}
    </button>
  )
}

## components/ui/Card.tsx

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Card({ children }: any) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      {children}
    </div>
  )
}

## components/ui/Input.tsx

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Input(props: any) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

## app/page.tsx

import Link from 'next/link'
import './globals.css'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Lockbox</h1>

        <div className="space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            Signup
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <h2 className="text-5xl font-bold mb-6">
          Secure Medical Records
        </h2>

        <p className="text-slate-400 max-w-2xl mb-8">
          Lockbox is an end-to-end encrypted medical record storage system.
          Only authorized users can access patient reports using AES + RSA encryption.
        </p>

        <div className="space-x-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 bg-slate-800 rounded-lg hover:bg-slate-700"
          >
            Login
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 border-t border-slate-800">
        End-to-End Encrypted Hospital Storage System
      </footer>
    </div>
  )
}

## app/layout.tsx

import './globals.css'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

## app/upload/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import {
  generateAESKey,
  encryptFile,
  exportAESKey,
  importPublicKey,
  encryptAESKeyWithRSA,
  bufferToBase64
} from '@/lib/crypto'

export default function UploadPage() {
  const params = useSearchParams()
  const patientId = params.get('patient_id')

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file || !patientId) return

    setLoading(true)

    const aesKey = await generateAESKey()
    const { encryptedFile, iv } = await encryptFile(file, aesKey)
    const aesKeyRaw = await exportAESKey(aesKey)

    const usersRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/files/authorized-users?patient_id=${patientId}`,
      { credentials: 'include' }
    )

    const users = await usersRes.json()

    const encryptedKeys = []

    for (const user of users) {
      const pubKey = await importPublicKey(user.public_key)
      const encryptedKey = await encryptAESKeyWithRSA(aesKeyRaw, pubKey)

      encryptedKeys.push({
        user_id: user.user_id,
        key: bufferToBase64(encryptedKey)
      })
    }

    const formData = new FormData()
    formData.append('file', new Blob([encryptedFile]), file.name)
    formData.append('iv', bufferToBase64(iv.buffer))
    formData.append('keys', JSON.stringify(encryptedKeys))
    formData.append('patient_id', patientId)

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    setLoading(false)
    alert('Uploaded successfully')
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Upload Report</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <input
          title='file'
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full"
        />

        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  )
}

## app/file/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  importPrivateKey,
  decryptAESKeyWithRSA,
  importAESKey,
  decryptFile,
  base64ToUint8Array
} from '@/lib/crypto'

export default function FileViewer() {
  const { id } = useParams()
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadFile() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/${id}`,
        { credentials: 'include' }
      )

      const data = await res.json()

      const privateKeyBase64 = localStorage.getItem('privateKey')!
      const privateKey = await importPrivateKey(privateKeyBase64)

      const aesRaw = await decryptAESKeyWithRSA(
        data.encrypted_key,
        privateKey
      )

      const aesKey = await importAESKey(aesRaw)

      const fileRes = await fetch(data.file_url)
      const encryptedFile = await fileRes.arrayBuffer()

      const iv = base64ToUint8Array(data.iv)

      const decrypted = await decryptFile(encryptedFile, aesKey, iv)

      const blob = new Blob([decrypted])
      const url = URL.createObjectURL(blob)

      setFileUrl(url)
    }

    loadFile()
  }, [id])

  if (!fileUrl) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">File Viewer</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <a
          href={fileUrl}
          download
          className="text-blue-600 underline"
        >
          Download File
        </a>

        <iframe title='file' src={fileUrl} className="w-full h-150 mt-4" />
      </div>
    </div>
  )
}

## app/(auth)/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

## app/(auth)/signup/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateRSAKeyPair, bufferToBase64 } from '@/lib/crypto'

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

    localStorage.setItem('privateKey', privateKeyBase64)

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role,
        hospital_id: role === 'patient' ? null : hospitalId,
        public_key: publicKeyBase64
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

## app/dashboard/layout.tsx

'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Role = 'patient' | 'doctor' | 'nurse' | 'admin'

type User = {
  id: string
  email: string
  role: Role
}

// Sidebar config (clean separation)
const navConfig: Record<Role, { label: string; href: string }[]> = {
  patient: [
    { label: 'Dashboard', href: '/dashboard/patient/dashboard' },
    { label: 'My Reports', href: '/dashboard/patient/files' }
  ],
  doctor: [
    { label: 'Dashboard', href: '/dashboard/doctor/dashboard' },
    { label: 'Patients', href: '/dashboard/doctor/patients' },
    { label: 'Upload Report', href: '/upload' }
  ],
  nurse: [
    { label: 'Dashboard', href: '/dashboard/nurse/dashboard' },
    { label: 'Assigned Patients', href: '/dashboard/nurse/assigned' }
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin/dashboard' },
    { label: 'All Users', href: '/dashboard/admin/users' },
    { label: 'All Files', href: '/dashboard/admin/files' }
  ]
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current user (from backend)
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            credentials: 'include'
          }
        )

        if (!res.ok) throw new Error()

        const data = await res.json()
        setUser(data)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const navItems = navConfig[user.role]

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-5">
        <h2 className="text-xl font-bold mb-8">Lockbox</h2>

        <nav className="space-y-3 flex-1">
          {navItems.map(item => {
            const isActive = pathname === item.href

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600'
                    : 'hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User info */}
        <div className="mt-6 border-t border-slate-700 pt-4 text-sm">
          <p className="truncate">{user.email}</p>
          <p className="text-gray-400 capitalize">{user.role}</p>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="font-semibold text-lg capitalize">
            {user.role} Panel
          </h1>

          <button
            onClick={async () => {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
                {
                  method: 'POST',
                  credentials: 'include'
                }
              )
              router.push('/login')
            }}
            className="text-sm text-red-500 hover:underline"
          >
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

## app/dashboard/patient/dashboard/page.tsx

export default function PatientDashboard() {
  return <div>Patient Dashboard</div>
}

## app/dashboard/patient/files/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileItem } from '@/types'

export default function PatientFiles() {
  const [files, setFiles] = useState<FileItem[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadFiles() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/list`,
        { credentials: 'include' }
      )

      const data: FileItem[] = await res.json()
      setFiles(data)
    }

    loadFiles()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>

      <div className="grid gap-4">
        {files.map(f => (
          <div
            key={f.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <p className="font-mono text-sm">{f.id}</p>

            <button
              onClick={() => router.push(`/file/${f.id}`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Open File
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

## app/dashboard/nurse/assigned/page.tsx

export default function NurseAssigned() {
  return <div>Assigned Patients</div>
}

## app/dashboard/nurse/dashboard/page.tsx

export default function NurseDashboard() {
  return <div>Nurse Dashboard</div>
}

## app/dashboard/doctor/dashboard/page.tsx

export default function DoctorDashboard() {
  return <div>Doctor Dashboard</div>
}

## app/dashboard/doctor/patients/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Patient } from '@/types'

export default function DoctorPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadPatients() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/list`,
        { credentials: 'include' }
      )

      const data: Patient[] = await res.json()
      setPatients(data)
    }

    loadPatients()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patients</h1>

      <div className="grid gap-4">
        {patients.map(p => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{p.email}</p>
              <p className="text-sm text-gray-500">{p.id}</p>
            </div>

            <button
              onClick={() => router.push(`/upload?patient_id=${p.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Report
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

## app/dashboard/admin/dashboard/page.tsx

export default function AdminDashboard() {
  return <div>Admin Dashboard</div>
}

## app/dashboard/admin/files/page.tsx

export default function AdminFiles() {
  return <div>All Files (admin)</div>
}

## app/dashboard/admin/users/page.tsx

export default function AdminUsers() {
  return <div>All Users (admin)</div>
}

## app/dashboard/[roles]/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'

type User = {
  email: string
  role: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadUser() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        { credentials: 'include' }
      )

      const data = await res.json()
      setUser(data)
    }

    loadUser()
  }, [])

  if (!user) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user.email}
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-600">
          You are logged in as <b>{user.role}</b>.
        </p>
      </div>
    </div>
  )
}