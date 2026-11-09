import { createLucideIcon } from 'lucide-react'

// Icons lucide doesn't have, drawn in its style (24×24 grid, round 2px strokes) so they sit with the rest.

/** A plain to-do: three equal lines, no checkmark (that's the complete button's job). */
export const TaskLines = createLucideIcon('task-lines', [['path', { d: 'M5 7h14M5 12h14M5 17h14', key: 'lines' }]])

/** A water bottle with a drop of water in it. */
export const BottleRefill = createLucideIcon('bottle-refill', [
  ['rect', { x: '9', y: '2', width: '6', height: '3', rx: '1', key: 'cap' }],
  ['path', { d: 'M9 5h6v1.4c1.8.8 3 2.6 3 4.6v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9c0-2 1.2-3.8 3-4.6z', key: 'body' }],
  ['path', { d: 'M12 11.5c1.3 1.7 2.1 2.8 2.1 4a2.1 2.1 0 0 1-4.2 0c0-1.2.8-2.3 2.1-4z', key: 'drop' }],
])

/** A bowl with chopsticks. */
export const Meal = createLucideIcon('meal', [
  ['path', { d: 'M3 11h18a9 9 0 0 1-18 0z', key: 'bowl' }],
  ['path', { d: 'M8 21h8', key: 'foot' }],
  ['path', { d: 'm14 2-3 9M19 3l-6 8', key: 'chopsticks' }],
])

/**
 * A delivery scooter, its box on the back. Kept to a few bold shapes so it reads at 16px, with the
 * handlebar facing forward so it stays clear of the box.
 */
export const FoodDelivery = createLucideIcon('food-delivery', [
  ['circle', { cx: '6', cy: '18', r: '3', key: 'rear-wheel' }],
  ['circle', { cx: '19.5', cy: '18', r: '3', key: 'front-wheel' }],
  ['rect', { x: '1.5', y: '4.5', width: '7.5', height: '7.5', rx: '1.5', key: 'box' }],
  ['path', { d: 'M9 18h6M19.5 18l-3.5-12h3.5M5.25 12v3', key: 'frame' }],
])

/** A two-tone capsule. */
export const Capsule = createLucideIcon('capsule', [
  ['rect', { x: '3', y: '9', width: '18', height: '6', rx: '3', transform: 'rotate(-45 12 12)', key: 'shell' }],
  ['path', { d: 'M12 9H6a3 3 0 0 0 0 6h6z', fill: 'currentColor', transform: 'rotate(-45 12 12)', key: 'half' }],
])

/** A shower: pipe, head and a spray of water. */
export const Shower = createLucideIcon('shower', [
  ['path', { d: 'M4 22V7a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v1', key: 'pipe' }],
  ['path', { d: 'M10.5 12.5a4.5 4.5 0 0 1 9 0z', key: 'head' }],
  ['path', { d: 'm12 16-.5 2M15 16v2M18 16l.5 2M11 21l-.3 1M15 21v1M19 21l.3 1', key: 'water' }],
])

/** A tooth, with a little shine. */
export const Tooth = createLucideIcon('tooth', [
  [
    'path',
    {
      d: 'M7 3C4.5 3 3 5 3 7.5c0 2 1 3.5 1.5 5.5.6 2.5 1 6 2.5 8 .8 1 2 .8 2.3-.5L10 16c.3-1.2 1.2-2 2-2s1.7.8 2 2l.7 4.5c.3 1.3 1.5 1.5 2.3.5 1.5-2 1.9-5.5 2.5-8 .5-2 1.5-3.5 1.5-5.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z',
      key: 'tooth',
    },
  ],
  ['path', { d: 'M7 7.5c0-1.2.8-2 2-2', key: 'shine' }],
])

/** A broom, and the sparkle it leaves behind. */
export const Broom = createLucideIcon('broom', [
  ['path', { d: 'M10 2v8', key: 'handle' }],
  ['path', { d: 'M6.5 10h7a1.5 1.5 0 0 1 1.5 1.5V13H5v-1.5A1.5 1.5 0 0 1 6.5 10z', key: 'band' }],
  ['path', { d: 'M5 13h10l1.5 8.4a.5.5 0 0 1-.5.6H4a.5.5 0 0 1-.5-.6z', key: 'head' }],
  ['path', { d: 'm8 22 .5-4M12 22l-.5-4', key: 'bristles' }],
  ['path', { d: 'M19 2Q19.6 4.9 22.5 5.5Q19.6 6.1 19 9Q18.4 6.1 15.5 5.5Q18.4 4.9 19 2Z', key: 'sparkle' }],
])

/** A freshly washed T-shirt, sparkling. */
export const CleanShirt = createLucideIcon('clean-shirt', [
  ['path', { d: 'M7.5 4 3 6l-1.5 4.5 3 1.2V21h11V11.7l3-1.2L17 6l-4.5-2a2.5 2.5 0 0 1-5 0z', key: 'shirt' }],
  ['path', { d: 'M20.5 1q.4 1.9 2.3 2.3q-1.9.4-2.3 2.3q-.4-1.9-2.3-2.3q1.9-.4 2.3-2.3z', key: 'sparkle' }],
])

/** A video player's play button. */
export const PlayButton = createLucideIcon('play-button', [
  ['rect', { x: '2', y: '5', width: '20', height: '14', rx: '4', key: 'frame' }],
  ['path', { d: 'm10 9 5 3-5 3z', fill: 'currentColor', key: 'play' }],
])
