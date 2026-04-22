'use client'

import Link from 'next/link'

export default function DoctorDashboard() {
  return (
    <div className="p-10 max-w-6xl mx-auto h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-800">Doctor Portal</h1>
        <p className="text-slate-500 mt-2">Welcome back. Here is your overview.</p>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href="/dashboard/doctor/patients" className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">My Patients</h3>
          <p className="text-sm text-slate-500">View your global list of patients and their encrypted records.</p>
        </Link>

        <Link href="/upload" className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-green-300 hover:shadow-md transition-all group">
          <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Upload Report</h3>
          <p className="text-sm text-slate-500">Securely encrypt and upload a new medical file for a patient.</p>
        </Link>

        <Link href="/audit" className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all group">
          <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Audit Ledger</h3>
          <p className="text-sm text-slate-500">Review the cryptographic blockchain history for all files.</p>
        </Link>
      </div>
    </div>
  )
}