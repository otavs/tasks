/**
 * Creates a user through the admin API, which only listens on 127.0.0.1 (so the server has to be running).
 *
 *   npm run create-user -- <username> [password]
 *
 * Without the password it's asked for, so it doesn't end up in the shell history.
 */
import 'dotenv/config'
import { createInterface } from 'node:readline'
import { adminPort } from '../utils/adminPort.ts'

const [username, passwordArg] = process.argv.slice(2)

if (!username) {
  console.error('Usage: npm run create-user -- <username> [password]')
  process.exit(1)
}

const password = passwordArg ?? (await askHidden('Password: '))
const url = `http://127.0.0.1:${adminPort()}/users`

let res: Response
try {
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
} catch {
  console.error(`Couldn't reach the admin API at ${url}. Is the server running?`)
  process.exit(1)
}

const body = await res.json().catch(() => ({}))

if (!res.ok) {
  console.error(`Couldn't create the user: ${body.error ?? `HTTP ${res.status}`}`)
  process.exit(1)
}

console.log(`Created user "${body.username}".`)
if (body.tookOverExistingData) console.log('It got the tasks and recurrences from before logins existed.')

function askHidden(question: string) {
  return new Promise<string>(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY })
    rl.question(question, answer => {
      rl.close()
      if (process.stdin.isTTY) process.stdout.write('\n')
      resolve(answer)
    })
    // After the prompt is out, echo nothing of what's typed.
    ;(rl as unknown as { _writeToOutput: (text: string) => void })._writeToOutput = () => {}
  })
}
