// The actual API logic, framework-agnostic: it works as a plain Node
// `http` request handler for local dev (see index.js) and as a Vercel
// serverless function (see ../api/[...path].js) without any changes,
// since both hand it the same (req, res) shape.
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from './db.js'
import { verifyIdToken } from './firebaseAuth.js'

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) reject(new Error('Body too large'))
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function validate(body) {
  const amount = Number(body.amount)
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const date = typeof body.date === 'string' ? body.date.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'amount must be a positive number' }
  if (!category) return { error: 'category is required' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'date must be in YYYY-MM-DD format' }

  return { value: { amount, category, date, note } }
}

// The frontend always calls this same-origin (via the Vite proxy in dev, and
// because both deploy together on one Vercel domain in production), so no
// CORS headers are needed here.
export async function handleRequest(req, res) {
  const { method } = req
  const url = new URL(req.url, `http://${req.headers.host}`)
  const parts = url.pathname.split('/').filter(Boolean) // e.g. ['api', 'expenses', '3']

  if (parts[0] !== 'api' || parts[1] !== 'expenses') {
    return send(res, 404, { error: 'Not found' })
  }

  // Every /api request must carry a valid Firebase ID token, checked before
  // any request data is parsed or the database is touched. The verified uid
  // — never anything the client sent — is what every query is scoped to.
  let userId
  try {
    userId = await verifyIdToken(req.headers.authorization)
  } catch (err) {
    return send(res, 401, { error: err.message })
  }

  const id = parts[2] ? Number(parts[2]) : null
  if (parts[2] && !Number.isInteger(id)) {
    return send(res, 400, { error: 'Invalid expense id' })
  }

  try {
    if (method === 'GET' && id === null) {
      return send(res, 200, await listExpenses(userId))
    }

    if (method === 'POST' && id === null) {
      const { value, error } = validate(await readJsonBody(req))
      if (error) return send(res, 400, { error })
      return send(res, 201, await createExpense(value, userId))
    }

    if (method === 'PUT' && id !== null) {
      const { value, error } = validate(await readJsonBody(req))
      if (error) return send(res, 400, { error })
      const updated = await updateExpense(id, value, userId)
      if (!updated) return send(res, 404, { error: 'Expense not found' })
      return send(res, 200, updated)
    }

    if (method === 'DELETE' && id !== null) {
      if (!(await deleteExpense(id, userId))) return send(res, 404, { error: 'Expense not found' })
      return send(res, 204)
    }

    return send(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return send(res, 400, { error: err.message || 'Request failed' })
  }
}
