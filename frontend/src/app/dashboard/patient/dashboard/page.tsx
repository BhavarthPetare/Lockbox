'use client'

import Link from 'next/link'

export default function PatientDashboard() {
  return (
    <div className="p-10 max-w-4xl mx-auto h-screen">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-800">Patient Portal</h1>
        <p className="text-slate-500 mt-2">Your medical records, safely encrypted and entirely in your control.</p>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-10 flex items-start space-x-4">
        <div className="bg-blue-100 p-2 rounded-full mt-1">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <div>
          <h4 className="font-bold text-slate-800">End-to-End Encrypted Session Active</h4>
          <p className="text-sm text-slate-600 mt-1">
            Your private key is currently loaded in your browser&apos;s secure memory. Only you and your authorized doctors can read your files. Our servers cannot see your data.
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/patient/files" className="block p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group">
          <div className="bg-slate-50 border border-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
            <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">My Reports</h3>
          <p className="text-sm text-slate-500">View and download your encrypted test results and medical documents.</p>
        </Link>

        {/* Placeholder for future features */}
        <div className="block p-6 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 opacity-60 cursor-not-allowed">
          <div className="bg-slate-200 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Profile Settings</h3>
          <p className="text-sm text-slate-500">Manage your account details and password. (Coming Soon)</p>
        </div>
      </div>
    </div>
  )
}