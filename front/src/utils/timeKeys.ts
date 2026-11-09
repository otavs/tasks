export type TimePart = 'hour' | 'minute'
export type TypedDigit = { part: TimePart; digit: number; at: number } | null

type KeyResult = { value: number; part: TimePart; typed: TypedDigit }

/**
 * Keyboard behaviour shared by the time pickers: digits ("1", "4" -> 14, then jump to the minutes),
 * ↑/↓ to adjust and ←/→ to switch part. Returns null for keys it doesn't handle.
 */
export function timeKeyAction(key: string, part: TimePart, value: number, typed: TypedDigit): KeyResult | null {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  const max = part === 'hour' ? 23 : 59
  const current = part === 'hour' ? hour : minute
  const withPart = (v: number) => (part === 'hour' ? v * 60 + minute : hour * 60 + v)
  const afterValue: TimePart = part === 'hour' ? 'minute' : part

  if (/^\d$/.test(key)) {
    const digit = Number(key)

    if (typed && typed.part === part && Date.now() - typed.at < 1500) {
      return { value: withPart(Math.min(typed.digit * 10 + digit, max)), part: afterValue, typed: null }
    }

    // No two-digit value starts with this digit ("7" can only mean 07).
    if (digit * 10 > max) return { value: withPart(digit), part: afterValue, typed: null }

    return { value: withPart(digit), part, typed: { part, digit, at: Date.now() } }
  }

  switch (key) {
    case 'ArrowUp':
      return { value: withPart((current + 1) % (max + 1)), part, typed: null }
    case 'ArrowDown':
      return { value: withPart((current + max) % (max + 1)), part, typed: null }
    case 'ArrowRight':
      return part === 'hour' ? { value, part: 'minute', typed: null } : null
    case 'ArrowLeft':
      return part === 'minute' ? { value, part: 'hour', typed: null } : null
  }

  return null
}
