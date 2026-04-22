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