import { createApp } from './app'
import { connectDb } from './config/db'

const PORT = 4000
const HOST = '0.0.0.0'

async function main() {
  await connectDb()
  const app = createApp()
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`)
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})






