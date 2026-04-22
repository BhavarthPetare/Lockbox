// RSA
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
}

// AES
export async function generateAESKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptFile(file: File, aesKey: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const buffer = await file.arrayBuffer()

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    buffer
  )

  return { encryptedFile: encrypted, iv }
}

export async function decryptFile(
  encryptedFile: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
) {
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    aesKey,
    encryptedFile
  )
}

export async function exportAESKey(aesKey: CryptoKey) {
  return await crypto.subtle.exportKey('raw', aesKey)
}

export async function importAESKey(rawKey: ArrayBuffer) {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
}

export async function importPublicKey(base64Key: string) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'spki',
    binary,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}

export async function importPrivateKey(base64Key: string) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  )
}

export async function encryptAESKeyWithRSA(aesKeyRaw: ArrayBuffer, publicKey: CryptoKey) {
  return await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    aesKeyRaw
  )
}

export async function decryptAESKeyWithRSA(encryptedKeyBase64: string, privateKey: CryptoKey) {
  const encrypted = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0))

  return await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encrypted
  )
}

export function bufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

export function base64ToUint8Array(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

// 1. Turn a password into an AES encryption key
export async function deriveKeyFromPassword(password: string, salt: string) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
}

// 2. Encrypt the Private Key before sending to the server
export async function encryptPrivateKeyWithPassword(privateKeyBase64: string, passwordKey: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    passwordKey,
    enc.encode(privateKeyBase64)
  )
  
  return {
    encryptedKey: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer)
  }
}

// 3. Decrypt the Private Key upon Login
export async function decryptPrivateKeyWithPassword(encryptedKeyBase64: string, ivBase64: string, passwordKey: CryptoKey) {
  const cipher = base64ToUint8Array(encryptedKeyBase64)
  const iv = base64ToUint8Array(ivBase64)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    passwordKey,
    cipher
  )
  
  return new TextDecoder().decode(decrypted)
}