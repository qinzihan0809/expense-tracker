import { useEffect, useState } from 'react'
import './App.css'
import * as api from './api'
import { useAuth } from './AuthContext'
import Login from './Login'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return dateFormatter.format(date)
}

const emptyForm = { amount: '', category: '', date: '', note: '' }

function ExpenseForm({ initialValue, submitLabel, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(initialValue ?? emptyForm)
  const [error, setError] = useState(null)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit({
        amount: Number(form.amount),
        category: form.category.trim(),
        date: form.date,
        note: form.note.trim(),
      })
      if (!initialValue) setForm(emptyForm)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          value={form.amount}
          onChange={handleChange}
        />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          type="text"
          required
          value={form.category}
          onChange={handleChange}
        />
      </div>
      <div className="field">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          name="date"
          type="date"
          required
          value={form.date}
          onChange={handleChange}
        />
      </div>
      <div className="field">
        <label htmlFor="note">Note</label>
        <input
          id="note"
          name="note"
          type="text"
          value={form.note}
          onChange={handleChange}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function App() {
  const { user, loading: authLoading, signOutUser } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return

    let isCancelled = false
    setIsLoading(true)
    api
      .fetchExpenses()
      .then((data) => {
        if (!isCancelled) setExpenses(data)
      })
      .catch((err) => {
        if (!isCancelled) setError(err.message)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [user])

  async function handleAdd(values) {
    setBusy(true)
    try {
      const created = await api.createExpense(values)
      setExpenses((prev) => [created, ...prev])
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(id, values) {
    setBusy(true)
    try {
      const updated = await api.updateExpense(id, values)
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
      setEditingId(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    setBusy(true)
    try {
      await api.deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (authLoading) {
    return <div className="app-loading">Loading…</div>
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>Daily Expense Tracker</h1>
          <div className="user-info">
            <span className="user-name">{user.displayName || user.email}</span>
            <button type="button" className="btn-secondary" onClick={signOutUser}>
              Sign out
            </button>
          </div>
        </div>
        <div className="total-card">
          <span className="total-label">Total Spent</span>
          <span className="total-amount">{currencyFormatter.format(total)}</span>
        </div>
      </header>

      <section className="add-section">
        <h2>Add an expense</h2>
        <ExpenseForm submitLabel="Add expense" onSubmit={handleAdd} busy={busy} />
      </section>

      <main className="expense-list-container">
        {isLoading && <p className="status-message">Loading expenses…</p>}

        {!isLoading && error && (
          <p className="status-message status-error">Couldn't load expenses: {error}</p>
        )}

        {!isLoading && !error && expenses.length === 0 && (
          <p className="status-message">No expenses recorded yet.</p>
        )}

        {!isLoading && !error && expenses.length > 0 && (
          <ul className="expense-list">
            {expenses.map((expense) =>
              editingId === expense.id ? (
                <li key={expense.id} className="expense-item expense-item-editing">
                  <ExpenseForm
                    initialValue={{
                      amount: String(expense.amount),
                      category: expense.category,
                      date: expense.date,
                      note: expense.note ?? '',
                    }}
                    submitLabel="Save changes"
                    onSubmit={(values) => handleUpdate(expense.id, values)}
                    onCancel={() => setEditingId(null)}
                    busy={busy}
                  />
                </li>
              ) : (
                <li key={expense.id} className="expense-item">
                  <div className="expense-main">
                    <span className="expense-category">{expense.category}</span>
                    <span className="expense-note">{expense.note}</span>
                  </div>
                  <div className="expense-side">
                    <span className="expense-date">{formatDate(expense.date)}</span>
                    <span className="expense-amount">
                      {currencyFormatter.format(expense.amount)}
                    </span>
                  </div>
                  <div className="expense-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingId(expense.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </main>
    </div>
  )
}
