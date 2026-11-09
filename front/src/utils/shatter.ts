type Point = { x: number; y: number }
type Polygon = Point[]
type Box = { x: number; y: number; w: number; h: number }

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

function area(polygon: Polygon) {
  let sum = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

function centroid(polygon: Polygon): Point {
  const sum = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / polygon.length, y: sum.y / polygon.length }
}

function bounds(polygon: Polygon): Box {
  const xs = polygon.map(p => p.x)
  const ys = polygon.map(p => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

/** The polygon's longest span (between two vertices) and its direction. */
function longestSpan(polygon: Polygon) {
  let length = 0
  let angle = 0
  for (let i = 0; i < polygon.length; i++) {
    for (let j = i + 1; j < polygon.length; j++) {
      const d = distance(polygon[i], polygon[j])
      if (d > length) {
        length = d
        angle = Math.atan2(polygon[j].y - polygon[i].y, polygon[j].x - polygon[i].x)
      }
    }
  }
  return { length, angle }
}

/** Cuts a convex polygon in two along the line through `through` with direction `angle`. */
function split(polygon: Polygon, through: Point, angle: number): [Polygon, Polygon] {
  const nx = -Math.sin(angle)
  const ny = Math.cos(angle)
  const side = (p: Point) => (p.x - through.x) * nx + (p.y - through.y) * ny
  const a: Polygon = []
  const b: Polygon = []
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i]
    const next = polygon[(i + 1) % polygon.length]
    const sc = side(current)
    const sn = side(next)
    if (sc <= 0) a.push(current)
    if (sc >= 0) b.push(current)
    if ((sc < 0 && sn > 0) || (sc > 0 && sn < 0)) {
      const crossing = lerp(current, next, sc / (sc - sn))
      a.push(crossing)
      b.push(crossing)
    }
  }
  return [a, b]
}

/** An angle difference folded into [0, π/2] (lines have no direction). */
function lineAngleGap(a: number, b: number) {
  const d = Math.abs((((a - b) % Math.PI) + Math.PI) % Math.PI)
  return Math.min(d, Math.PI - d)
}

const MAX_SHARDS = 64

/**
 * Breaks a width×height pane hit at `impact` into convex shards, the way glass goes: tiny pieces
 * around the impact, bigger ones further out. Pieces are cut across their long side, along whichever
 * of the radial or ring direction is closer, which draws the usual web of radial and circular cracks.
 */
function fracture(width: number, height: number, impact: Point): Polygon[] {
  const shards: Polygon[] = []
  const queue: Polygon[] = [
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  ]

  while (queue.length) {
    const polygon = queue.shift()!
    const center = centroid(polygon)
    const { length, angle: axis } = longestSpan(polygon)
    const target = Math.min(85, 14 + distance(center, impact) * 0.22) * rand(0.8, 1.25)

    if (length <= target || shards.length + queue.length >= MAX_SHARDS) {
      shards.push(polygon)
      continue
    }

    const radial = Math.atan2(center.y - impact.y, center.x - impact.x)
    const across = axis + Math.PI / 2
    const cut =
      (lineAngleGap(across, radial) < lineAngleGap(across, radial + Math.PI / 2) ? radial : radial + Math.PI / 2) +
      rand(-0.3, 0.3)
    const through = lerp(center, polygon[Math.floor(Math.random() * polygon.length)], rand(0, 0.3))
    const [a, b] = split(polygon, through, cut)

    if (a.length < 3 || b.length < 3 || area(a) < 10 || area(b) < 10) shards.push(polygon)
    else queue.push(a, b)
  }

  return shards
}

/** A thrown piece: initial velocity (px/s), air drag (1/s) and spin around each axis (deg/s). */
type Throw = { vx: number; vy: number; vz: number; drag: number; spin: [number, number, number] }
const GRAVITY = 2600 // px/s²

/** Position, depth and rotation along a throw with air drag and gravity, `t` seconds in. */
function transformAt({ vx, vy, vz, drag, spin }: Throw, t: number, start: Point) {
  // Velocity decays with drag (dv/dt = g - k·v) and falls towards terminal speed.
  const e = (1 - Math.exp(-drag * t)) / drag
  const x = start.x + vx * e
  const y = start.y + vy * e + (GRAVITY / drag) * (t - e)
  const z = vz * e
  const [rx, ry, rz] = spin.map(w => w * (e + 0.25 * t))
  return `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
}

const FRAMES = 16

/** Samples a throw lasting `duration` ms; the piece fades out from `fadeFrom` (0..1) of the way. */
function throwKeyframes(motion: Throw, start: Point, duration: number, fadeFrom: number): Keyframe[] {
  return Array.from({ length: FRAMES + 1 }, (_, i) => {
    const progress = i / FRAMES
    return {
      transform: transformAt(motion, (progress * duration) / 1000, start),
      opacity: progress < fadeFrom ? 1 : 1 - (progress - fadeFrom) / (1 - fadeFrom),
    }
  })
}

function svgPolygon(points: Polygon, width: number, height: number) {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  Object.assign(svg.style, { position: 'absolute', inset: '0', overflow: 'visible' })
  const polygon = document.createElementNS(ns, 'polygon')
  polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '))
  polygon.setAttribute('fill', 'none')
  polygon.setAttribute('stroke', 'white')
  polygon.setAttribute('stroke-opacity', String(rand(0.45, 0.8)))
  polygon.setAttribute('stroke-width', '2')
  polygon.setAttribute('stroke-linejoin', 'round')
  svg.appendChild(polygon)
  return svg
}

function absolute(style: Partial<CSSStyleDeclaration>) {
  const element = document.createElement('div')
  Object.assign(element.style, { position: 'absolute', ...style })
  return element
}

const LAYER_CLASS = 'shatter-layer'

/**
 * The copies are stills: their CSS animations (like an overdue card's flowing background) stay
 * paused, so no shard repaints while it flies, and nothing in them gets a layer of its own
 * (`will-change` left inline by animations), so each shard is painted once, as one piece.
 * Only the shards' own motion runs, on the compositor.
 */
function freezeCopies() {
  if (document.getElementById(LAYER_CLASS)) return
  const style = document.createElement('style')
  style.id = LAYER_CLASS
  style.textContent = `.${LAYER_CLASS} *, .${LAYER_CLASS} *::before, .${LAYER_CLASS} *::after {
    animation-play-state: paused !important;
    transition: none !important;
    will-change: auto !important;
  }`
  document.head.appendChild(style)
}

const isPlainContainer = (element: Element) => {
  if (element.children.length < 2) return false
  if ([...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) return false
  const style = getComputedStyle(element)
  return (
    style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderStyle === 'none'
  )
}

/**
 * The card taken apart for copying: its own box (background, border, shadow) without content, and
 * each piece of content as a copy placed where it was. A shard then carries only the pieces that show
 * through it, rather than a copy of the whole card.
 */
function takeApart(element: HTMLElement, rect: DOMRect) {
  const computed = getComputedStyle(element)
  const shell = element.cloneNode(false) as HTMLElement
  shell.removeAttribute('id')
  Object.assign(shell.style, {
    position: 'absolute',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    transform: 'none',
    opacity: '1',
    // Frozen as it looked, hover colours included.
    backgroundColor: computed.backgroundColor,
    borderColor: computed.borderColor,
  })

  const parts: { box: Box; copy: HTMLElement }[] = []
  const collect = (parent: Element) => {
    for (const child of parent.children) {
      if (isPlainContainer(child)) {
        collect(child)
        continue
      }
      const r = child.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const box = { x: r.left - rect.left, y: r.top - rect.top, w: r.width, h: r.height }
      const copy = child.cloneNode(true) as HTMLElement
      Object.assign(copy.style, {
        position: 'absolute',
        // Inside the shell, positions start inside its border.
        left: `${box.x - element.clientLeft}px`,
        top: `${box.y - element.clientTop}px`,
        // A hair wider, so text can't wrap differently.
        width: `${box.w + 0.5}px`,
        height: `${box.h}px`,
        margin: '0',
      })
      parts.push({ box, copy })
    }
  }
  collect(element)

  return { shell, parts }
}

/**
 * Shatters an element like glass from an impact point (viewport coordinates): it breaks into shards
 * (copies of it clipped to polygons) that burst out every way at once, tumbling in 3D under drag and
 * gravity, with a flash, a ring and some glass dust.
 * Everything that moves is a transform or opacity animation, so it runs on the compositor.
 * Returns false (and does nothing) when the user prefers reduced motion.
 */
export function shatter(element: HTMLElement, impact?: Point): boolean {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false

  const rect = element.getBoundingClientRect()
  const { width, height } = rect
  const hit: Point = impact
    ? { x: Math.min(Math.max(impact.x - rect.left, 0), width), y: Math.min(Math.max(impact.y - rect.top, 0), height) }
    : { x: width * 0.85, y: height / 2 }
  const hitOnScreen = { x: rect.left + hit.x, y: rect.top + hit.y }

  freezeCopies()
  const layer = absolute({
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '55',
    overflow: 'hidden',
    perspective: '1000px',
    perspectiveOrigin: `${rect.left + width / 2}px ${rect.top + height / 2}px`,
  })
  layer.className = LAYER_CLASS
  layer.setAttribute('aria-hidden', 'true')

  const { shell, parts } = takeApart(element, rect)
  let longest = 0

  for (const polygon of fracture(width, height, hit)) {
    const box = bounds(polygon)
    const local = polygon.map(p => ({ x: p.x - box.x, y: p.y - box.y }))
    const center = centroid(polygon)

    // The whole card bursts outwards from its middle, every way: measured relative to the card's
    // size, so a wide, short card throws as much up and down as it does to the sides.
    const direction = Math.atan2((center.y - height / 2) / height, (center.x - width / 2) / width) + rand(-0.5, 0.5)
    // Pieces near the impact get an extra kick.
    const power = 0.8 + 0.7 * Math.exp(-distance(center, hit) / 160)
    const speed = rand(900, 1500) * power
    const motion: Throw = {
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed - rand(150, 400),
      vz: rand(-150, 350) * power,
      drag: rand(2.2, 3.2),
      spin: [rand(-720, 720), rand(-720, 720), rand(-900, 900) * power],
    }
    const flight = rand(1100, 1600)
    longest = Math.max(longest, flight)

    // The moving piece is a plain box; the shard inside it is clipped to shape. Clipping a child
    // (not the animated element itself) bakes the shape into the piece's pixels, painted once.
    const piece = absolute({
      left: `${rect.left + box.x}px`,
      top: `${rect.top + box.y}px`,
      width: `${box.w}px`,
      height: `${box.h}px`,
      transformOrigin: `${center.x - box.x}px ${center.y - box.y}px`,
    })
    const shard = absolute({ inset: '0', clipPath: `polygon(${local.map(p => `${p.x}px ${p.y}px`).join(',')})` })

    const copy = shell.cloneNode(false) as HTMLElement
    copy.style.left = `${-box.x}px`
    copy.style.top = `${-box.y}px`
    for (const part of parts) if (overlaps(part.box, box)) copy.appendChild(part.copy.cloneNode(true))
    shard.appendChild(copy)
    // Light catching the glass: a glint across it, and its broken edges.
    shard.appendChild(
      absolute({
        inset: '0',
        background: `linear-gradient(${rand(100, 170)}deg, rgb(255 255 255 / ${rand(0.15, 0.55)}), rgb(255 255 255 / 0) 60%)`,
      })
    )
    shard.appendChild(svgPolygon(local, box.w, box.h))
    piece.appendChild(shard)
    layer.appendChild(piece)

    piece.animate(throwKeyframes(motion, { x: 0, y: 0 }, flight, 0.55), {
      duration: flight,
      easing: 'linear',
      fill: 'both',
    })
  }

  // Glass dust: tiny bright splinters that fly the fastest.
  for (let i = 0; i < 18; i++) {
    const size = rand(2, 5)
    const speck = absolute({
      left: `${hitOnScreen.x - size / 2}px`,
      top: `${hitOnScreen.y - size / 2}px`,
      width: `${size}px`,
      height: `${size * rand(1, 2.2)}px`,
      background: Math.random() < 0.5 ? 'rgb(255 255 255 / 0.95)' : 'rgb(224 242 254 / 0.9)',
      clipPath: 'polygon(50% 0, 100% 100%, 0 80%)',
    })
    layer.appendChild(speck)
    const angle = rand(0, Math.PI * 2)
    const speed = rand(1200, 2600)
    const flight = rand(550, 950)
    speck.animate(
      throwKeyframes(
        {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 300,
          vz: 0,
          drag: 4,
          spin: [0, 0, rand(-1400, 1400)],
        },
        { x: 0, y: 0 },
        flight,
        0.4
      ),
      { duration: flight, easing: 'linear', fill: 'both' }
    )
    longest = Math.max(longest, flight)
  }

  // The hit itself: a bright flash and a shockwave ring.
  const flash = absolute({
    left: `${hitOnScreen.x - 90}px`,
    top: `${hitOnScreen.y - 90}px`,
    width: '180px',
    height: '180px',
    borderRadius: '9999px',
    background: 'radial-gradient(circle, rgb(255 255 255 / 1), rgb(255 255 255 / 0.6) 25%, rgb(255 255 255 / 0) 65%)',
  })
  const ring = absolute({
    left: `${hitOnScreen.x - 100}px`,
    top: `${hitOnScreen.y - 100}px`,
    width: '200px',
    height: '200px',
    borderRadius: '9999px',
    border: '3px solid rgb(255 255 255 / 0.85)',
    boxShadow: '0 0 12px rgb(255 255 255 / 0.6), inset 0 0 12px rgb(255 255 255 / 0.6)',
  })
  layer.append(flash, ring)
  flash.animate(
    [
      { transform: 'scale(0.15)', opacity: 1 },
      { transform: 'scale(1.6)', opacity: 0 },
    ],
    { duration: 320, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)', fill: 'both' }
  )
  ring.animate(
    [
      { transform: 'scale(0.05)', opacity: 1 },
      { transform: 'scale(1.5)', opacity: 0 },
    ],
    { duration: 480, easing: 'cubic-bezier(0.15, 0.85, 0.3, 1)', fill: 'both' }
  )

  document.body.appendChild(layer)
  setTimeout(() => layer.remove(), longest + 100)
  return true
}
