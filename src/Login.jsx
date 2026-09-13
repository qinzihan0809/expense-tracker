import { useState } from 'react'
import { useAuth } from './AuthContext'
import { friendlyAuthError } from './authErrors'

export default function Login() {
  const { signInWithGoogle, signInOrSignUpWithEmail, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError('Please enter both an email and a password.')
      return
    }

    setBusy(true)
    try {
      await signInOrSignUpWithEmail(email.trim(), password)
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim()) {
      setError('Enter your email above, then click "Forgot password?" again.')
      return
    }

    setBusy(true)
    try {
      await resetPassword(email.trim())
      setInfo('Password reset email sent — check your inbox.')
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Daily Expense Tracker</h1>
        <p className="login-subtitle">Sign in to track your spending.</p>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={busy}
        >
          Sign in with Google
        </button>

        <div className="login-divider">
          <span>or</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="link-button"
            onClick={handleForgotPassword}
            disabled={busy}
          >
            Forgot password?
          </button>

          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}

          <button type="submit" disabled={busy}>
            Continue
          </button>
        </form>

        <p className="login-hint">
          New here? Just sign in with an email and password to create an account.
        </p>
      </div>
    </div>
  )
}
