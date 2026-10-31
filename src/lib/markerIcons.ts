import { createElement } from 'react'
import { Car, Trash, WarningCircle } from '@phosphor-icons/react'
import { GROUPS, type Group } from '@/lib/incidents'
import { PROBLEM_STATUS } from '@/lib/problems'
import { KEEP, mix, token } from '@/lib/tokens'

/** Street-level markers (Waze style): a big colored square (owner, 2026-10-30; it was a circle pin) with the category's icon inside, anchored at its center. One image per category and status. */
export const ICONS = { parking: Car, illegal_dumping: Trash }
export const iconCategory = (category: string) => (category in ICONS ? category : 'parking')
export const badgeId = (category: string, group: string, dim = false, step = 0) => `badge-${iconCategory(category)}${dim ? '-dim' : ''}-${group}-${step}`
/** Square marker sizes by zoom (owner, 2026-10-30), in screen px: step 0 from zoom 13, step 1 from zoom 14. The icon is its own size in each, so each step is its own image. */
export const BADGE_STEPS = [
  { square: 24, icon: 12 },
  { square: 30, icon: 16 },
]
/** Plain squares by zoom, in screen px (owner, 2026-10-30): step 0 at zoom 11 and below, step 1 at zoom 12 (up to 13, where the icon squares start). */
export const PLAIN_PX = [8, 10]
/** The selected incident's ring is this much bigger than its square marker. */
export const RING_EXTRA = 10

/** The badge is a square, 64 px including the outline. */
const SIZE = 64
/** Outline outside the circle, 7.5 % of its diameter (Figma Map Pin: 2.4 px outside a 32 px pin, 2026-10-26). */
const OUTLINE = 4.2

/** The far-zoom marker: a small square in the status color with an outline, 24 px (shown at 8 px at every zoom below 14). One image per status, and a toned-down one. */
export const dotId = (group: string, dim = false) => `dot${dim ? '-dim' : ''}-${group}`
export function addDots(map: { addImage: (id: string, data: ImageData) => void }) {
  const outline = token('--map-dot-outline')
  const land = token('--map-background')
  for (const group of Object.keys(GROUPS) as Group[]) {
    for (const dim of [false, true]) {
      const c = document.createElement('canvas')
      c.width = c.height = 24
      const g = c.getContext('2d')!
      g.fillStyle = outline
      g.fillRect(0, 0, 24, 24)
      g.fillStyle = dim ? mix(token(GROUPS[group].token), land, KEEP) : token(GROUPS[group].token)
      g.fillRect(3, 3, 18, 18)
      map.addImage(dotId(group, dim), g.getImageData(0, 0, 24, 24))
    }
  }
}

/** The ring around the selected incident (owner, 2026-10-30): an empty square outline, 96 px, about 2 px on screen (1.6 px at zoom 14 to 2.8 px at zoom 18). */
export function addSelectedRing(map: { addImage: (id: string, data: ImageData) => void }) {
  const c = document.createElement('canvas')
  c.width = c.height = 96
  const g = c.getContext('2d')!
  g.lineWidth = 4
  g.strokeStyle = token('--map-selected-ring')
  g.strokeRect(2, 2, 92, 92)
  map.addImage('selected-ring', g.getImageData(0, 0, 96, 96))
}

/** Softness of the outline only, in image px. Uses canvas filter, so a browser without it just keeps a sharp outline. */
const OUTLINE_BLUR = 1


async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string, iconPx: number) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: ink, width: iconPx, height: iconPx, weight: 'fill' }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const g = c.getContext('2d')!
  g.beginPath() // the square; the outline sits outside it, so the whole marker fits in SIZE
  g.rect(OUTLINE, OUTLINE, SIZE - 2 * OUTLINE, SIZE - 2 * OUTLINE)
  // Outside outline: stroke twice as wide, then paint the fill over its inner half.
  g.lineJoin = 'round'
  g.lineWidth = OUTLINE * 2
  g.strokeStyle = outline
  g.filter = `blur(${OUTLINE_BLUR}px)`
  g.stroke()
  g.filter = 'none'
  g.fillStyle = fill
  g.fill()
  g.drawImage(img, (SIZE - iconPx) / 2, (SIZE - iconPx) / 2, iconPx, iconPx)
  return g.getImageData(0, 0, SIZE, SIZE)
}

/** Adds every badge to the map. Icon ink is dark, except on Approved (a mid blue) where it is light. */
export async function addBadges(map: { addImage: (id: string, data: ImageData) => void }) {
  const outline = token('--map-dot-outline')
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      (Object.keys(GROUPS) as Group[]).flatMap((group) => {
        const ink = token(group === 'approved' ? '--neutral-100' : '--neutral-900')
        const fill = token(GROUPS[group].token)
        const land = token('--map-background')
        // The same pin toned down toward the land color: it keeps its hue, so the status is still readable.
        return BADGE_STEPS.flatMap((st, step) =>
          [false, true].map(async (dim) =>
            // the image is 64 px and shown at square / 64, so the icon's pixels in the image are icon * 64 / square
            map.addImage(badgeId(category, group, dim, step), await badge(Icon, dim ? mix(fill, land, KEEP) : fill, dim ? mix(ink, land, KEEP) : ink, outline, (st.icon * SIZE) / st.square)),
          ),
        )
      }),
    ),
  )
}

/** Persistent-problem marker (decision 0030; owner's test 2026-10-30): a circle in the problem's status color with the category icon in it and a 2 px neutral-900 outline, and a small round alert badge (neutral-900, no outline, WarningCircle icon) on its upper right. The occurrence count is not drawn here: it shows in the card you get by hovering the problem. One image per category and status, scaled by zoom. */
/** The marker is drawn once at its biggest size, in screen px: circle, category icon, badge. */
export const PROBLEM_SIZE = { circle: 42, icon: 24, badge: 28 }
/** The circle's size by map zoom (owner, 2026-10-30): the one image is scaled smoothly between these, so there is no jump (the icon and the badge scale with it). 12 and below stays at the first, 14 and above at the last. */
export const PROBLEM_CIRCLE_BY_ZOOM: [number, number][] = [[12, 28], [13, 32], [14, 42]]
export const problemMarkerId = (category: string, status: string) => `problem-${iconCategory(category)}-${status}`
/** The images are drawn at 2x and shown at half size. */
export const PROBLEM_SCALE = 0.5
const OUTLINE_PX = 2 // the circle's outline, outside, in screen px: neutral-900
const PAD = Math.ceil(OUTLINE_PX / PROBLEM_SCALE) // image px kept free left of and below the circle so the outline is not cut off
const BIG = PROBLEM_SIZE
const BADGE_AT = 0.5125 // the badge's center sits this share of the circle's diameter right of and above the circle's center
const CIRCLE = { x: BIG.circle + PAD, y: Math.ceil(BIG.circle * 2 * BADGE_AT + BIG.badge) + 2 } // the circle's center, in image px, the same in every step so one icon offset serves them all
const IMAGE_SIZE = { w: Math.ceil(CIRCLE.x + BIG.circle * 2 * BADGE_AT + BIG.badge) + 2, h: CIRCLE.y + BIG.circle + PAD }
/** Puts the circle (not the whole image with its badge) on the spot. */
export const PROBLEM_OFFSET: [number, number] = [IMAGE_SIZE.w / 2 - CIRCLE.x, IMAGE_SIZE.h / 2 - CIRCLE.y]

async function drawIcon(Icon: (typeof ICONS)[keyof typeof ICONS] | typeof WarningCircle, color: string, size: number, weight: 'fill' | 'bold' = 'fill') {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(createElement(Icon, { color, width: size, height: size, weight })))}`
  await img.decode()
  return img
}

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], status: string, step: typeof PROBLEM_SIZE) {
  const alertSize = Math.round(step.badge * 0.715) * 2 // the alert icon is about 0.7 of the badge
  const [icon, alert] = await Promise.all([drawIcon(Icon, token('--neutral-900'), step.icon * 2), drawIcon(WarningCircle, token('--neutral-100'), alertSize)])
  const c = document.createElement('canvas')
  c.width = IMAGE_SIZE.w
  c.height = IMAGE_SIZE.h
  const g = c.getContext('2d')!
  g.beginPath() // the circle, with an outline outside it: stroke twice as wide, then paint the fill over the inner half
  g.arc(CIRCLE.x, CIRCLE.y, step.circle, 0, Math.PI * 2)
  g.lineWidth = (OUTLINE_PX / PROBLEM_SCALE) * 2
  g.strokeStyle = token('--neutral-900')
  g.stroke()
  g.fillStyle = token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token)
  g.fill()
  g.drawImage(icon, CIRCLE.x - step.icon, CIRCLE.y - step.icon, step.icon * 2, step.icon * 2)
  const off = step.circle * 2 * BADGE_AT
  g.beginPath() // the alert badge: a round version of the Figma count pill, no outline
  g.arc(CIRCLE.x + off, CIRCLE.y - off, step.badge, 0, Math.PI * 2)
  g.fillStyle = token('--neutral-900')
  g.fill()
  g.drawImage(alert, CIRCLE.x + off - alertSize / 2, CIRCLE.y - off - alertSize / 2, alertSize, alertSize)
  return g.getImageData(0, 0, IMAGE_SIZE.w, IMAGE_SIZE.h)
}

export async function addProblemMarkers(map: { addImage: (id: string, data: ImageData) => void }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).map(async (status) => map.addImage(problemMarkerId(category, status), await problemMarker(Icon, status, PROBLEM_SIZE))),
    ),
  )
}
