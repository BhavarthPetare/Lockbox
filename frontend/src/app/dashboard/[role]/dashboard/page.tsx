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