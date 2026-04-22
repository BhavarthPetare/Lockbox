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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFile() {
      try {
        const privateKeyBase64 = localStorage.getItem('privateKey')

        // 1. Check if the key actually exists in this browser session
        if (!privateKeyBase64) {
          setError("Your encryption key is missing! Because this is End-to-End Encrypted, logging out or switching browsers destroys your local key. Please create a new patient account to test the flow.")
          return
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/files/${id}`,
          { credentials: 'include' }
        )

        if (!res.ok) throw new Error("Failed to fetch file metadata from server.")
        const data = await res.json()

        // 2. Import the key and decrypt
        const privateKey = await importPrivateKey(privateKeyBase64)
        const aesRaw = await decryptAESKeyWithRSA(data.encrypted_key, privateKey)
        const aesKey = await importAESKey(aesRaw)

        // 3. Fetch and decrypt the actual file
        const fileRes = await fetch(data.file_url)
        const encryptedFile = await fileRes.arrayBuffer()
        const iv = base64ToUint8Array(data.iv)

        const decrypted = await decryptFile(encryptedFile, aesKey, iv)
        const blob = new Blob([decrypted], {type: data.file_type})
        const url = URL.createObjectURL(blob)

        setFileUrl(url)
      } catch (err) {
        console.error(err)
        setError("Failed to decrypt the file. The key might be invalid or the file is corrupted.")
      }
    }

    loadFile()
  }, [id])

  // Show our friendly error message instead of crashing
  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
         <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm">
            <h2 className="font-bold text-lg mb-2">Decryption Error</h2>
            <p>{error}</p>
         </div>
      </div>
    )
  }

  if (!fileUrl) return <div className="p-6 animate-pulse text-slate-500">Decrypting file...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">File Viewer</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <a
          href={fileUrl}
          download={"decrypted_report"}
          className="inline-block mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Download Decrypted File
        </a>

        <iframe title='file' src={fileUrl} className="w-full h-[600px] border rounded-lg" />
      </div>
    </div>
  )
}