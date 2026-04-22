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
    if (!file) {
      alert('Please select a file first: ')
      return
    }

    if (!patientId) {
      alert('No patient selected')
      return
    }

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
    formData.append('file_name', file.name)
    formData.append('file_type', file.type)

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
        <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
          <label className="cursor-pointer block flex flex-col items-center justify-center">
            <span className="text-slate-600 font-medium mb-3">
              {file ? file.name : "Click to browse for a medical report"}
            </span>
            <input
              title='file'
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700 file:cursor-pointer cursor-pointer mx-auto"
            />
          </label>
        </div>

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