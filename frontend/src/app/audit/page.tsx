'use client'

import { useEffect, useState } from 'react'

type FileItem = {
  id: string
  file_name?: string
}

type AuditBlock = {
  index: number
  timestamp: string
  action: string
  user_id: string
  block_hash: string
  previous_hash: string
}

export default function AuditDashboard() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [blocks, setBlocks] = useState<AuditBlock[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  const [error, setError] = useState('')

  // 1. Fetch the master list of files on load
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/all`, {
          credentials: 'include'
        })
        if (!res.ok) throw new Error("Failed to load file list. Are you logged in as a Doctor?")
        const data = await res.json()
        setFiles(data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoadingFiles(false)
      }
    }
    fetchFiles()
  }, [])

  // 2. Fetch the blockchain whenever a file is selected
  useEffect(() => {
    if (!selectedFile) return

    async function fetchBlockchain() {
      setLoadingBlocks(true)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/files/${selectedFile?.id}/audit`,
          { credentials: 'include' }
        )
        if (!res.ok) throw new Error("Failed to load blockchain.")
        const data = await res.json()
        setBlocks(data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoadingBlocks(false)
      }
    }
    fetchBlockchain()
  }, [selectedFile])

  if (loadingFiles) return <div className="p-10 text-slate-500 animate-pulse">Loading ledgers...</div>
  if (error) return <div className="p-10 text-red-500">{error}</div>

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* LEFT SIDEBAR: List of Blockchains */}
      <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
          <h2 className="text-xl font-bold text-slate-800">Global Audit Ledgers</h2>
          <p className="text-xs text-slate-500 mt-1">Select a file to view its history</p>
        </div>
        
        <div className="p-4 space-y-2">
          {files.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFile(f)}
              className={`w-full text-left p-4 rounded-xl transition-all border ${
                selectedFile?.id === f.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <p className={`font-semibold ${selectedFile?.id === f.id ? 'text-blue-700' : 'text-slate-800'}`}>
                {f.file_name || "Unknown File"}
              </p>
              <p className="font-mono text-[10px] text-slate-400 mt-1 truncate">
                {f.id}
              </p>
            </button>
          ))}
          {files.length === 0 && (
             <p className="text-slate-500 text-sm text-center p-4">No files exist in the system yet.</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: The Blockchain Visualizer */}
      <div className="w-2/3 overflow-y-auto p-10">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Select a ledger from the left to view the cryptographic chain.
          </div>
        ) : loadingBlocks ? (
           <div className="text-slate-500 animate-pulse">Decrypting blocks...</div>
        ) : (
          <div className="max-w-3xl mx-auto pb-20">
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Chain: {selectedFile.file_name}</h1>
            <p className="text-slate-500 mb-10 font-mono text-xs">Target UUID: {selectedFile.id}</p>

            <div className="space-y-6">
              {blocks.map((block, i) => (
                <div key={block.block_hash} className="relative">
                  {/* The Chain Link (Vertical Line) */}
                  {i !== blocks.length - 1 && (
                    <div className="absolute left-8 top-16 -bottom-6 w-1 bg-blue-200 z-0"></div>
                  )}

                  {/* The Block */}
                  <div className="relative z-10 bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:border-blue-400 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-600 text-white font-bold h-10 w-10 flex items-center justify-center rounded-lg shadow-inner">
                          #{block.index}
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            block.action === 'UPLOAD' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {block.action}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">
                          {new Date(block.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-xs bg-slate-50 p-4 rounded-lg border border-slate-100 overflow-x-auto">
                      <div className="flex items-center">
                        <span className="text-slate-400 w-24 shrink-0 font-sans text-[11px] uppercase tracking-wider">Actor ID:</span>
                        <span className="text-slate-700">{block.user_id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-400 w-24 shrink-0 font-sans text-[11px] uppercase tracking-wider">Prev Hash:</span>
                        <span className="text-slate-500 truncate" title={block.previous_hash}>
                          {block.previous_hash.substring(0, 48)}...
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-400 w-24 shrink-0 font-sans text-[11px] uppercase tracking-wider">Block Hash:</span>
                        <span className="text-blue-600 font-bold truncate" title={block.block_hash}>
                          {block.block_hash}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}