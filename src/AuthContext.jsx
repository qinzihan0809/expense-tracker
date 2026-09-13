import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
  }, [])

  function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  // There's no separate "sign up" flow for email/password: a new address
  // creates an account, an existing one signs straight in.
  async function signInOrSignUpWithEmail(email, password) {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        throw err
      }
    }
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  function signOutUser() {
    return signOut(auth)
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInOrSignUpWithEmail,
    resetPassword,
    signOutUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
