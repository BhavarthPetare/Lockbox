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