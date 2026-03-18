import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceDir = path.resolve(__dirname, '../../dist')
const targetDir = path.resolve(__dirname, '../web-dist')

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Web build not found at ${sourceDir}. Run the root web build first.`)
}

fs.rmSync(targetDir, { recursive: true, force: true })
fs.mkdirSync(targetDir, { recursive: true })
fs.cpSync(sourceDir, targetDir, { recursive: true })
