import { TaskDateModel } from '@/typings/types'

export const host = import.meta.env.VITE_HOST

export const taskListKey = (date: TaskDateModel) => ['tasks', date.day, date.month, date.year]

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown }

export async function request<T = unknown>(path: string, { json, headers, ...init }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${host}${path}`, {
    ...init,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.error ?? body?.message ?? `Request failed (${res.status})`)
  }

  return body as T
}
