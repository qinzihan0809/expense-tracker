import { createClient } from '@libsql/client'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from the project-root .env
// (unless they are already present in the environment).
try {
  process.loadEnvFile(join(__dirname, '..', '.env'))
} catch {
  // No .env file — rely on the ambient environment.
}

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  throw new Error('TURSO_DATABASE_URL is not set (check your .env file)')
}

const db = createClient({ url, authToken })

function toExpense(row) {
  return {
    id: Number(row.id),
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    note: row.note ?? '',
  }
}

// Create the table on startup if it does not exist.
await db.execute(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    user_id TEXT NOT NULL DEFAULT ''
  )
`)

// Migrate a table created before user_id existed.
const { rows: columns } = await db.execute('PRAGMA table_info(expenses)')
const hasUserId = columns.some((column) => column.name === 'user_id')
if (!hasUserId) {
  await db.execute("ALTER TABLE expenses ADD COLUMN user_id TEXT NOT NULL DEFAULT ''")
}

export async function listExpenses(userId) {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC',
    args: [userId],
  })
  return rows.map(toExpense)
}

export async function getExpense(id, userId) {
  const { rows } = await db.execute({
    sql: 'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
    args: [id, userId],
  })
  return rows[0] ? toExpense(rows[0]) : undefined
}

export async function createExpense({ amount, category, date, note }, userId) {
  const result = await db.execute({
    sql: 'INSERT INTO expenses (amount, category, date, note, user_id) VALUES (?, ?, ?, ?, ?)',
    args: [amount, category, date, note ?? '', userId],
  })
  return getExpense(Number(result.lastInsertRowid), userId)
}

export async function updateExpense(id, { amount, category, date, note }, userId) {
  const result = await db.execute({
    sql: 'UPDATE expenses SET amount = ?, category = ?, date = ?, note = ? WHERE id = ? AND user_id = ?',
    args: [amount, category, date, note ?? '', id, userId],
  })
  if (result.rowsAffected === 0) return null
  return getExpense(id, userId)
}

export async function deleteExpense(id, userId) {
  const result = await db.execute({
    sql: 'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    args: [id, userId],
  })
  return result.rowsAffected > 0
}
