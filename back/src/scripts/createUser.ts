/**
 * Creates a user, straight in the database (so it works whether the server is running or not).
 *
 *   npm run create-user -- <username> [password]
 *
 * Without the password it's asked for, so it doesn't end up in the shell history.
 */
import { createInterface } from 'node:readline'
import { prisma } from '../prisma.ts'
import { createUser, CreateUserError } from '../utils/users.ts'

const [username, passwordArg] = process.argv.slice(2)

if (!username) {
  console.error('Usage: npm run create-user -- <username> [password]')
  process.exit(1)
}

const password = passwordArg ?? (await askHidden('Password: '))

try {
  const user = await createUser(username, password)
  console.log(`Created user "${user.username}".`)
  if (user.tookOverExistingData) console.log('It got the tasks and recurrences from before logins existed.')
} catch (error) {
  console.error(`Couldn't create the user: ${error instanceof CreateUserError ? error.message : error}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}

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
