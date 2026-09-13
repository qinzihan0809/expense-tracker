// Vercel deploys this one file as a single serverless function and routes
// every request under /api/* to it (the [...path] filename is Vercel's
// catch-all convention — see https://vercel.com/docs/functions). It shares
// the exact same request handling as local dev; see server/app.js.
import { handleRequest } from '../server/app.js'

export default function handler(req, res) {
  return handleRequest(req, res)
}
