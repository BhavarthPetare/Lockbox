export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ADMIN: 'admin'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]