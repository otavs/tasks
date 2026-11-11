import { CSSProperties } from 'react'

const blob = (color: string) => ({ '--blob': color }) as CSSProperties

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob animate-drift-a -top-[12vh] -left-[10vw] size-[55vmax]" style={blob('var(--blob-1)')} />
      <div
        className="blob animate-drift-b top-[30vh] -right-[18vw] size-[50vmax] opacity-60"
        style={blob('var(--blob-2)')}
      />
      <div
        className="blob animate-drift-c -bottom-[25vh] left-[15vw] size-[45vmax] opacity-50"
        style={blob('var(--blob-3)')}
      />
    </div>
  )
}
