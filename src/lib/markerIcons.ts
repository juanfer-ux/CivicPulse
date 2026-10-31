import { createElement } from 'react'
import { Car, Trash, WarningCircle } from '@phosphor-icons/react'
import { GROUPS, type Group } from '@/lib/incidents'
import { PROBLEM_STATUS } from '@/lib/problems'
import { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_PX, PROBLEM_SIZE, RING_EXTRA } from '@/lib/markerSizes'
import { KEEP, mix, token } from '@/lib/tokens'

export { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_BY_ZOOM, PROBLEM_CIRCLE_PX, PROBLEM_SIZE, PROBLEM_SWITCH_ZOOMS, RING_EXTRA } from '@/lib/markerSizes'

/** Street-level markers (Waze style): a big colored square (owner, 2026-10-30; it was a circle pin) with the category's icon inside, anchored at its center. One image per category and status. */
export const ICONS = { parking: Car, illegal_dumping: Trash }
export const iconCategory = (category: string) => (category in ICONS ? category : 'parking')
export const badgeId = (category: string, group: string, dim = false, step = 0) => `badge-${iconCategory(category)}${dim ? '-dim' : ''}-${group}-${step}`

/** Every marker image is drawn at twice its size on screen and added with pixelRatio 2 (one image pixel is half a screen pixel), and every size has its own image, so the map never shrinks an image by a fraction: that is what made the outlines look crackled. */
const PR = 2
type AddImage = (id: string, data: ImageData, options?: { pixelRatio: number }) => void
const put = (map: { addImage: AddImage }, id: string, data: ImageData) => map.addImage(id, data, { pixelRatio: PR })

/** Outline outside a square marker, as a share of its size (7.5 %, Figma Map Pin 2026-10-26: 2.4 px around 32 px). */
const OUTLINE = 4.2 / 64

/** The far-zoom marker: a plain square in the status color with an outline (a 1/8 border), one image per size (PLAIN_PX), status and a toned-down version. */
export const dotId = (group: string, dim = false, step = 0) => `dot${dim ? '-dim' : ''}-${group}-${step}`
export function addDots(map: { addImage: AddImage }) {
  const outline = token('--map-dot-outline')
  const land = token('--map-background')
  PLAIN_PX.forEach((size, step) => {
    const side = size * PR
    const b = (size / 8) * PR
    for (const group of Object.keys(GROUPS) as Group[]) {
      for (const dim of [false, true]) {
        const c = document.createElement('canvas')
        c.width = c.height = side
        const g = c.getContext('2d')!
        g.fillStyle = outline
        g.fillRect(0, 0, side, side)
        g.fillStyle = dim ? mix(token(GROUPS[group].token), land, KEEP) : token(GROUPS[group].token)
        g.fillRect(b, b, side - 2 * b, side - 2 * b)
        put(map, dotId(group, dim, step), g.getImageData(0, 0, side, side))
      }
    }
  })
}

/** The ring around the selected incident (owner, 2026-10-30): an empty square outline, 2 px on screen, 10 px bigger than the marker; one image per marker size. */
export const selectedRingId = (step: number) => `selected-ring-${step}`
export function addSelectedRing(map: { addImage: AddImage }) {
  BADGE_STEPS.forEach((st, step) => {
    const side = (st.square + RING_EXTRA) * PR
    const lw = 2 * PR
    const c = document.createElement('canvas')
    c.width = c.height = side
    const g = c.getContext('2d')!
    g.lineWidth = lw
    g.strokeStyle = token('--map-selected-ring')
    g.strokeRect(lw / 2, lw / 2, side - lw, side - lw)
    put(map, selectedRingId(step), g.getImageData(0, 0, side, side))
  })
}

async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string, square: number, iconPx: number) {
  const icon = await drawIcon(Icon, ink, iconPx * PR)
  const side = square * PR
  const b = square * OUTLINE * PR
  const c = document.createElement('canvas')
  c.width = c.height = side
  const g = c.getContext('2d')!
  g.beginPath() // the square; the outline sits outside it, so the whole marker fits in the image
  g.rect(b, b, side - 2 * b, side - 2 * b)
  // Outside outline: stroke twice as wide, then paint the fill over its inner half.
  g.lineJoin = 'miter'
  g.lineWidth = b * 2
  g.strokeStyle = outline
  g.stroke()
  g.fillStyle = fill
  g.fill()
  g.drawImage(icon, (side - iconPx * PR) / 2, (side - iconPx * PR) / 2, iconPx * PR, iconPx * PR)
  return g.getImageData(0, 0, side, side)
}

/** Adds every badge to the map. Icon ink is dark, except on Approved (a mid blue) where it is light. */
export async function addBadges(map: { addImage: AddImage }) {
  const outline = token('--map-dot-outline')
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      (Object.keys(GROUPS) as Group[]).flatMap((group) => {
        const ink = token(group === 'approved' ? '--neutral-100' : '--neutral-900')
        const fill = token(GROUPS[group].token)
        const land = token('--map-background')
        // The same marker toned down toward the land color: it keeps its hue, so the status is still readable.
        return BADGE_STEPS.flatMap((st, step) =>
          [false, true].map(async (dim) => put(map, badgeId(category, group, dim, step), await badge(Icon, dim ? mix(fill, land, KEEP) : fill, dim ? mix(ink, land, KEEP) : ink, outline, st.square, st.icon))),
        )
      }),
    ),
  )
}

/** Persistent-problem marker (decision 0030; owner's test 2026-10-30): a circle in the problem's status color with the category icon in it and a 2 px neutral-900 outline, and a small round alert badge (neutral-900, no outline, WarningCircle icon) on its upper right. The occurrence count is not drawn here: it shows in the card you get by hovering the problem. One image per category, status and circle size (PROBLEM_CIRCLE_PX), each centered on the circle so the layer needs no offset. */
export const problemMarkerId = (category: string, status: string, px: number) => `problem-${iconCategory(category)}-${status}-${px}`
const OUTLINE_PX = 2 // the circle's outline, outside, in screen px: neutral-900
const BADGE_AT = 0.5125 // the badge's center sits this share of the circle's diameter right of and above the circle's center

async function drawIcon(Icon: (typeof ICONS)[keyof typeof ICONS] | typeof WarningCircle, color: string, size: number, weight: 'fill' | 'bold' = 'fill') {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(createElement(Icon, { color, width: size, height: size, weight })))}`
  await img.decode()
  return img
}

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], status: string, circle: number) {
  const f = circle / PROBLEM_SIZE.circle // the icon and the badge scale with the circle
  const iconPx = PROBLEM_SIZE.icon * f
  const badgeD = PROBLEM_SIZE.badge * f
  const alertPx = badgeD * 0.715 // the alert icon is about 0.7 of the badge
  const off = BADGE_AT * circle
  const half = Math.ceil(Math.max(circle / 2 + OUTLINE_PX, off + badgeD / 2)) + 1 // screen px from the circle's center to the image edge, on every side
  const side = half * 2 * PR
  const [icon, alert] = await Promise.all([drawIcon(Icon, token('--neutral-900'), iconPx * PR), drawIcon(WarningCircle, token('--neutral-100'), alertPx * PR)])
  const c = document.createElement('canvas')
  c.width = c.height = side
  const g = c.getContext('2d')!
  const mid = side / 2
  g.beginPath() // the circle, with an outline outside it: stroke twice as wide, then paint the fill over the inner half
  g.arc(mid, mid, (circle / 2) * PR, 0, Math.PI * 2)
  g.lineWidth = OUTLINE_PX * PR * 2
  g.strokeStyle = token('--neutral-900')
  g.stroke()
  g.fillStyle = token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token)
  g.fill()
  g.drawImage(icon, mid - (iconPx * PR) / 2, mid - (iconPx * PR) / 2, iconPx * PR, iconPx * PR)
  const bx = mid + off * PR
  const by = mid - off * PR
  g.beginPath() // the alert badge: a round version of the Figma count pill, no outline
  g.arc(bx, by, (badgeD / 2) * PR, 0, Math.PI * 2)
  g.fillStyle = token('--neutral-900')
  g.fill()
  g.drawImage(alert, bx - (alertPx * PR) / 2, by - (alertPx * PR) / 2, alertPx * PR, alertPx * PR)
  return g.getImageData(0, 0, side, side)
}

export async function addProblemMarkers(map: { addImage: AddImage }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).flatMap((status) => PROBLEM_CIRCLE_PX.map(async (px) => put(map, problemMarkerId(category, status, px), await problemMarker(Icon, status, px)))),
    ),
  )
}
