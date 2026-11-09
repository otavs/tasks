import { prisma } from '../prisma.ts'

/** The account behind the public demo (/demo). It has no password, so nobody can log into it. */
export const DEMO_USERNAME = 'demo'

/**
 * Anyone can write to the demo, so its storage is capped. Instead of refusing changes once full (which would let one
 * visitor break the demo for everyone), the oldest tasks / recurrences make room for new ones.
 */
export const DEMO_LIMITS = { tasks: 1000, recurrences: 50 }

let demoUserIdPromise: Promise<number> | undefined

/** The demo user's id. Creates the user if it doesn't exist, and makes sure it has no password. */
export function demoUserId() {
  if (!demoUserIdPromise) {
    demoUserIdPromise = prisma.user
      .upsert({
        where: { username: DEMO_USERNAME },
        create: { username: DEMO_USERNAME },
        update: { passwordHash: null },
        select: { id: true },
      })
      .then(user => user.id)
    demoUserIdPromise.catch(() => (demoUserIdPromise = undefined)) // try again next time
  }
  return demoUserIdPromise
}

async function trimDemoData() {
  const userId = await demoUserId()

  const oldRecurrences = await prisma.recurrence.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    skip: DEMO_LIMITS.recurrences,
    select: { id: true },
  })
  if (oldRecurrences.length > 0) {
    await prisma.recurrence.deleteMany({ where: { id: { in: oldRecurrences.map(({ id }) => id) } } })
  }

  const oldTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    skip: DEMO_LIMITS.tasks,
    select: { id: true },
  })
  if (oldTasks.length > 0) {
    await prisma.task.deleteMany({ where: { id: { in: oldTasks.map(({ id }) => id) } } })
  }
}

let trimming: Promise<void> | undefined
let trimAgain = false

/** Brings the demo back under its limits. Calls during a trim are merged into one more run after it. */
export function scheduleDemoTrim() {
  if (trimming) {
    trimAgain = true
    return
  }

  trimming = trimDemoData()
    .catch(error => console.error('Error trimming the demo data:', error))
    .finally(() => {
      trimming = undefined
      if (trimAgain) {
        trimAgain = false
        scheduleDemoTrim()
      }
    })
}
