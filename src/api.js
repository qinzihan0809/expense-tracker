import { auth } from './firebase'

// All expense data comes from the backend API (proxied to the server by Vite in
// dev). Override with VITE_API_URL to point at the backend directly.
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api/expenses`

async function authHeaders() {
  const user = auth.currentUser
  if (!user) return {}
  const token = await user.getIdToken()
  return { Authorization: `Bearer ${token}` }
}

async function request(url, options = {}) {
  const headers = { ...options.headers, ...(await authHeaders()) }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (status ${response.status})`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // response had no JSON body
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

export function fetchExpenses() {
  return request(BASE)
}

export function createExpense(expense) {
  return request(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
}

export function updateExpense(id, expense) {
  return request(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
}

export function deleteExpense(id) {
  return request(`${BASE}/${id}`, { method: 'DELETE' })
}
