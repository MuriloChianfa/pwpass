const API_URL = import.meta.env.VITE_API_URL as string
if (!API_URL) {
  throw new Error('VITE_API_URL environment variable is not set')
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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function pushSecret(params: PushSecretParams): Promise<string> {
  const { token } = await api<{ token: string }>('/secrets', {
    method: 'POST',
    body: JSON.stringify({
      content: params.content,
      passphrase: params.passphrase || undefined,
      expire_days: params.expireDays,
      max_views: params.maxViews,
      allow_deletion: params.allowDeletion,
    }),
  })
  return token
}

export async function getSecret(
  token: string,
  passphrase?: string,
): Promise<{ ok: true; data: SecretResult } | { ok: false; error: string }> {
  try {
    const res = await api<{
      content: string
      remaining_views: number
      expires_at: number
      allow_deletion: boolean
    }>(`/secrets/${token}/view`, {
      method: 'POST',
      body: JSON.stringify({ passphrase }),
    })
    return {
      ok: true,
      data: {
        content: res.content,
        remainingViews: res.remaining_views,
        expiresAt: res.expires_at * 1000,
        allowDeletion: res.allow_deletion,
      },
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function deleteSecret(token: string): Promise<boolean> {
  try {
    await api(`/secrets/${token}`, { method: 'DELETE' })
    return true
  } catch {
    return false
  }
}

export type MetaResult =
  | { status: 'found'; hasPassphrase: boolean }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

export async function getSecretMeta(token: string): Promise<MetaResult> {
  try {
    const res = await api<{ has_passphrase: boolean }>(`/secrets/${token}/meta`)
    return { status: 'found', hasPassphrase: res.has_passphrase }
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('not found')) {
      return { status: 'not_found' }
    }
    return { status: 'error', message: msg }
  }
}
