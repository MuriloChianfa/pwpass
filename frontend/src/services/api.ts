import { nanoid } from 'nanoid'

const STORAGE_PREFIX = 'pwpass:'

export interface StoredSecret {
  content: string
  passphrase?: string
  expiresAt: number
  maxViews: number
  currentViews: number
  allowDeletion: boolean
  createdAt: number
}

export interface PushSecretParams {
  content: string
  passphrase?: string
  expireDays: number
  maxViews: number
  allowDeletion: boolean
}

export interface SecretResult {
  content: string
  remainingViews: number
  expiresAt: number
  allowDeletion: boolean
}

function getStorageKey(token: string): string {
  return `${STORAGE_PREFIX}${token}`
}

export function pushSecret(params: PushSecretParams): string {
  const token = nanoid(21)
  const secret: StoredSecret = {
    content: params.content,
    passphrase: params.passphrase || undefined,
    expiresAt: Date.now() + params.expireDays * 24 * 60 * 60 * 1000,
    maxViews: params.maxViews,
    currentViews: 0,
    allowDeletion: params.allowDeletion,
    createdAt: Date.now(),
  }

  localStorage.setItem(getStorageKey(token), JSON.stringify(secret))
  return token
}

export function getSecret(
  token: string,
  passphrase?: string,
): { ok: true; data: SecretResult } | { ok: false; error: string } {
  const raw = localStorage.getItem(getStorageKey(token))

  if (!raw) {
    return { ok: false, error: 'This password has expired or does not exist.' }
  }

  const secret: StoredSecret = JSON.parse(raw)

  if (Date.now() > secret.expiresAt) {
    localStorage.removeItem(getStorageKey(token))
    return { ok: false, error: 'This password has expired.' }
  }

  if (secret.currentViews >= secret.maxViews) {
    localStorage.removeItem(getStorageKey(token))
    return { ok: false, error: 'This password has reached its maximum view count.' }
  }

  if (secret.passphrase && secret.passphrase !== passphrase) {
    return { ok: false, error: 'Invalid passphrase.' }
  }

  secret.currentViews += 1
  const isLastView = secret.currentViews >= secret.maxViews

  if (isLastView) {
    localStorage.removeItem(getStorageKey(token))
  } else {
    localStorage.setItem(getStorageKey(token), JSON.stringify(secret))
  }

  return {
    ok: true,
    data: {
      content: secret.content,
      remainingViews: secret.maxViews - secret.currentViews,
      expiresAt: secret.expiresAt,
      allowDeletion: secret.allowDeletion,
    },
  }
}

export function deleteSecret(token: string): boolean {
  const key = getStorageKey(token)
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key)
    return true
  }
  return false
}

export function hasPassphrase(token: string): boolean {
  const raw = localStorage.getItem(getStorageKey(token))
  if (!raw) return false
  const secret: StoredSecret = JSON.parse(raw)
  return !!secret.passphrase
}
