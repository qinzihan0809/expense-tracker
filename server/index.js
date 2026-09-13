// Local dev entry point: runs the same handler Vercel runs in production
// (see ../api/[...path].js) as a plain Node HTTP server on its own port,
// so `npm run server` + the Vite proxy keep working exactly as before.
import { createServer } from 'node:http'
import { handleRequest } from './app.js'

const PORT = Number(process.env.PORT) || 3001

createServer(handleRequest).listen(PORT, () => {
  console.log(`Expense API listening on http://localhost:${PORT}`)
})
