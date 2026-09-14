// Maps Firebase Auth error codes to messages a person can actually act on.
const MESSAGES = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/missing-password': 'Please enter a password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
  // Configuration problems that only show up once deployed: Firebase trusts
  // localhost out of the box, so neither of these can happen in local dev.
  'auth/unauthorized-domain':
    "This site's address isn't authorized for sign-in yet. Please contact support.",
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
}

export function friendlyAuthError(error) {
  return MESSAGES[error?.code] || 'Something went wrong. Please try again.'
}
