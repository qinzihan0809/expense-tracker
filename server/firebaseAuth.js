import { createRemoteJWKSet, jwtVerify } from 'jose'

// Reuses the same project id the frontend already has in .env — the VITE_
// prefix only controls what Vite inlines into the browser bundle, it has no
// bearing on what a plain Node process can read from the environment.
const projectId = process.env.VITE_FIREBASE_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_FIREBASE_PROJECT_ID is not set (check your .env file)')
}

const ISSUER = `https://securetoken.google.com/${projectId}`

// Google's public signing keys for Firebase Auth ID tokens. No credentials
// needed to fetch these — verifying a token this way only proves it was
// issued by this Firebase project, which is all an API needs.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

/**
 * Verifies a Firebase Auth ID token from an `Authorization: Bearer <token>`
 * header and returns the signed-in user's uid. Throws a user-safe message
 * (never the raw token or a stack trace) if the token is missing or invalid.
 */
export async function verifyIdToken(authorizationHeader) {
  const token = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : ''

  if (!token) {
    throw new Error('Missing sign-in token')
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: projectId,
    }))
  } catch {
    throw new Error('Invalid or expired sign-in token')
  }

  if (!payload.sub) {
    throw new Error('Invalid sign-in token')
  }

  return payload.sub
}
