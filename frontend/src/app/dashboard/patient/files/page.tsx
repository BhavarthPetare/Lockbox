'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileItem } from '@/types'

export default function PatientFiles() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function loadFiles() {
      try {
        // 1. Get the current logged-in patient's details
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          { credentials: 'include' }
        )
        
        if (!userRes.ok) {
          throw new Error("Failed to authenticate user")
        }
        
        const user = await userRes.json()

        // 2. Fetch files, passing the patient_id as a query parameter
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/files/list?patient_id=${user.id}`,
          { credentials: 'include' }
        )

        if (!res.ok) {
          throw new Error(`Backend returned status: ${res.status}`)
        }

        const data = await res.json()

        if (Array.isArray(data)) {
          setFiles(data)
        } else {
          console.error("Expected an array of files, received:", data)
          setFiles([])
        }
      } catch (err) {
        console.error("Fetch error:", err)
        setError("Could not load your reports. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [])

  // 1. Show a loading state while fetching
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading reports...</p>
      </div>
    )
  }

  // 2. Show a friendly error if the fetch failed
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Reports</h1>
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      </div>
    )
  }

  // 3. Main render
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>

      {files.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center text-slate-500">
          <p>You dont have any medical reports yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {files.map(f => (
            <div
              key={f.id}
              className="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:shadow-md transition"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div>
                  <p className="font-semibold text-slate-800">{f.file_name || "Unknown Document"}</p>
                  <p className="font-mono text-xs text-slate-400">ID: {f.id}</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/file/${f.id}`)}
                className="bg-slate-100 text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}