import { TaskDateModel } from '@/typings/types'
import { isDemo } from '@/utils/route'

export const host = import.meta.env.VITE_HOST

/** The demo has the same API under /demo, on the shared demo account. */
const apiBase = isDemo ? `${host}/demo` : host

export const taskListKey = (date: TaskDateModel) => ['tasks', date.day, date.month, date.year]

/** Not logged in (or the session expired). */
export class UnauthorizedError extends Error {}

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown }

export async function request<T = unknown>(path: string, { json, headers, ...init }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    // The session cookie also goes along in development, where the API is on another port.
    credentials: 'include',
    ...init,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message = body?.error ?? body?.message ?? `Request failed (${res.status})`
    throw res.status === 401 ? new UnauthorizedError(message) : new Error(message)
  }

  return body as T
}
