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