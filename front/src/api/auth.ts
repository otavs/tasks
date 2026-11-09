import { request } from './api'

export const meKey = ['me']

/** Throws UnauthorizedError when logged out. */
export const fetchMe = () => request<{ username: string }>('/auth/me')

export const login = (username: string, password: string) =>
  request<{ username: string }>('/auth/login', { method: 'POST', json: { username, password } })

export const logout = () => request('/auth/logout', { method: 'POST' })
