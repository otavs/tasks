type Point = { x: number; y: number }

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/**
 * Points around the rectangle's border (corners included), in order along the perimeter.
 * Longer edges get more points, so the shards come out roughly even.
 */
function perimeterPoints(width: number, height: number): Point[] {
  const perEdge = (length: number) => Math.max(1, Math.round(length / 70))
  const edge = (from: Point, to: Point, count: number) => {
    const points = [from]
    const ts = Array.from({ length: count }, (_, i) => (i + rand(0.25, 0.75)) / count).sort((a, b) => a - b)
    for (const t of ts) points.push(lerp(from, to, t))
    return points
  }
  const tl = { x: 0, y: 0 }
  const tr = { x: width, y: 0 }
  const br = { x: width, y: height }
  const bl = { x: 0, y: height }
  return [
    ...edge(tl, tr, perEdge(width)),
    ...edge(tr, br, perEdge(height)),
    ...edge(br, bl, perEdge(width)),
    ...edge(bl, tl, perEdge(height)),
  ]
}

/**
 * Shatters an element like glass from an impact point (viewport coordinates): the element is cut into
 * shards (copies of it clipped to polygons) that crack, then fly apart with a bit of gravity and spin.
 * Returns false (and does nothing) when the user prefers reduced motion.
 */
export function shatter(element: HTMLElement, impact?: Point): boolean {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false

  const rect = element.getBoundingClientRect()
  const { width, height } = rect
  const center: Point = impact
    ? { x: Math.min(Math.max(impact.x - rect.left, 0), width), y: Math.min(Math.max(impact.y - rect.top, 0), height) }
    : { x: width * 0.85, y: height / 2 }

  // A fan of triangles from the impact covers the whole (convex) card. Each one is split into a small
  // inner shard and a bigger outer one, along a ring of points shared by neighbours, so nothing gaps.
  const outer = perimeterPoints(width, height)
  const ring = outer.map(point => lerp(center, point, rand(0.3, 0.6)))
  const shards: Point[][] = []
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    shards.push([center, ring[i], ring[j]])
    shards.push([ring[i], outer[i], outer[j], ring[j]])
  }

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '55', overflow: 'hidden' })

  const snapshot = element.cloneNode(true) as HTMLElement
  snapshot.removeAttribute('id')
  Object.assign(snapshot.style, {
    position: 'absolute',
    inset: '0',
    width: `${width}px`,
    height: `${height}px`,
    margin: '0',
    transform: 'none',
    opacity: '1',
  })

  const gravity = 1400 // px/s²
  let longest = 0

  for (const polygon of shards) {
    const centroid = polygon.reduce(
      (sum, p) => ({ x: sum.x + p.x / polygon.length, y: sum.y + p.y / polygon.length }),
      {
        x: 0,
        y: 0,
      }
    )
    const dx = centroid.x - center.x
    const dy = centroid.y - center.y
    const distance = Math.hypot(dx, dy) || 1
    const nx = dx / distance
    const ny = dy / distance

    // Shards near the impact fly off faster; everything gets a little upward kick.
    const speed = rand(140, 300) * (1 + 60 / (distance + 30))
    const vx = nx * speed + rand(-40, 40)
    const vy = ny * speed * 0.7 - rand(120, 280)
    const spin = rand(-540, 540)
    const duration = rand(850, 1250)
    longest = Math.max(longest, duration)

    // The moving piece carries the shadow; the clipped shard inside gives it its shape, so the
    // shadow follows the jagged edge (a filter on the clipped element itself would be clipped too).
    const piece = document.createElement('div')
    Object.assign(piece.style, {
      position: 'absolute',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${width}px`,
      height: `${height}px`,
      transformOrigin: `${centroid.x}px ${centroid.y}px`,
      filter: 'drop-shadow(0 3px 5px rgb(15 23 42 / 0.2))',
      willChange: 'transform, opacity',
    })

    const shard = document.createElement('div')
    Object.assign(shard.style, {
      position: 'absolute',
      inset: '0',
      clipPath: `polygon(${polygon.map(p => `${p.x}px ${p.y}px`).join(',')})`,
    })
    shard.appendChild(snapshot.cloneNode(true))

    // A diagonal glint so the pieces read as glass.
    const glint = document.createElement('div')
    Object.assign(glint.style, {
      position: 'absolute',
      inset: '0',
      background: `linear-gradient(${rand(110, 160)}deg, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0) 40%)`,
    })
    shard.appendChild(glint)

    piece.appendChild(shard)
    layer.appendChild(piece)

    const at = (t: number) => {
      const s = t * (duration / 1000)
      return `translate(${vx * s}px, ${vy * s + 0.5 * gravity * s * s}px) rotate(${spin * t}deg) scale(${1 - 0.4 * t})`
    }

    piece.animate(
      [
        { transform: 'none', opacity: 1, offset: 0 },
        // The crack: shards barely part before flying.
        { transform: `translate(${nx * 3}px, ${ny * 3}px)`, opacity: 1, offset: 0.07 },
        { transform: at(0.35), opacity: 1, offset: 0.35 },
        { transform: at(0.7), opacity: 0.75, offset: 0.7 },
        { transform: at(1), opacity: 0, offset: 1 },
      ],
      { duration, easing: 'linear', fill: 'forwards' }
    )
  }

  // A soft flash where it was hit.
  const flash = document.createElement('div')
  Object.assign(flash.style, {
    position: 'absolute',
    left: `${rect.left + center.x - 60}px`,
    top: `${rect.top + center.y - 60}px`,
    width: '120px',
    height: '120px',
    borderRadius: '9999px',
    background: 'radial-gradient(circle, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0) 65%)',
  })
  layer.appendChild(flash)
  flash.animate(
    [
      { transform: 'scale(0.2)', opacity: 1 },
      { transform: 'scale(1.4)', opacity: 0 },
    ],
    { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
  )

  document.body.appendChild(layer)
  setTimeout(() => layer.remove(), longest + 100)
  return true
}
