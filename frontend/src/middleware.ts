import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

type JWTPayload = {
  id: string
  role: 'patient' | 'doctor' | 'nurse' | 'admin'
  email: string
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  // Public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')
  ) {
    return NextResponse.next()
  }

  // If no token → go to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  let user: JWTPayload

  try {
    user = await verifyToken(token)
  } catch (err) {
    console.error(err)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = user.role

  // Admin can access everything
  if (role === 'admin') {
    return NextResponse.next()
  }

  // Role-based dashboard protection
  if (pathname.startsWith('/dashboard/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/dashboard/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/dashboard/nurse') && role !== 'nurse') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Upload restriction (only doctor + admin)
  if (pathname.startsWith('/upload') && role === 'patient') {
    return NextResponse.redirect(new URL('/dashboard/patient/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload',
    '/file/:path*'
  ]
}