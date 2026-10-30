import { createElement } from 'react'
import { Car, Trash, Warning } from '@phosphor-icons/react'
import { GROUPS, type Group } from '@/lib/incidents'
import { PROBLEM_STATUS } from '@/lib/problems'
import { KEEP, mix, token } from '@/lib/tokens'

/** Street-level markers (Waze style): a big colored circle with the category's icon inside. One image per category and status. */
export const ICONS = { parking: Car, illegal_dumping: Trash }
export const iconCategory = (category: string) => (category in ICONS ? category : 'parking')
export const badgeId = (category: string, group: string, dim = false) => `badge-${iconCategory(category)}${dim ? '-dim' : ''}-${group}`

/** The badge is a pin: a circle with a point below it, so the tip marks the exact spot (the layer anchors the image at its bottom). 64 px wide including the outline. */
const SIZE = 64
/** Outline outside the circle, 7.5 % of its diameter (Figma Map Pin: 2.4 px outside a 32 px pin, 2026-10-26). */
const OUTLINE = 4.2
/** Length of the pin's point, in image px (displayed at 0.4 to 0.8 of this, depending on zoom). */
export const TAIL = 8
export const PIN_CENTER = SIZE / 2 // circle center, in image px from the top (the circle is at the top)
export const PIN_RISE = SIZE + TAIL - PIN_CENTER // image px from the bottom of the image (the exact spot) up to the circle center

/** Softness of the outline only, in image px. Uses canvas filter, so a browser without it just keeps a sharp outline. */
const OUTLINE_BLUR = 1

const ICON = 28 // half the circle's diameter, like Figma (16 px icon in a 32 px pin)

async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string, tail = TAIL) {
  const height = SIZE + tail
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: ink, width: ICON, height: ICON, weight: 'fill' }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = height
  const g = c.getContext('2d')!
  const r = SIZE / 2 - OUTLINE // the circle; the outline sits outside it, so the whole pin fits in SIZE
  g.beginPath()
  g.arc(SIZE / 2, PIN_CENTER, r, Math.atan2(0.75 * r, -0.67 * r), Math.PI * 2 + Math.atan2(0.75 * r, 0.67 * r))
  g.lineTo(SIZE / 2, height - OUTLINE)
  g.closePath()
  // Outside outline: stroke twice as wide, then paint the fill over its inner half.
  g.lineJoin = 'round'
  g.lineWidth = OUTLINE * 2
  g.strokeStyle = outline
  g.filter = `blur(${OUTLINE_BLUR}px)`
  g.stroke()
  g.filter = 'none'
  g.fillStyle = fill
  g.fill()
  g.drawImage(img, (SIZE - ICON) / 2, PIN_CENTER - ICON / 2, ICON, ICON)
  return g.getImageData(0, 0, SIZE, height)
}

/** Adds every badge to the map. Icon ink is dark, except on Approved (a mid blue) where it is light. */
export async function addBadges(map: { addImage: (id: string, data: ImageData) => void }, tail = TAIL) {
  const outline = token('--map-dot-outline')
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      (Object.keys(GROUPS) as Group[]).flatMap((group) => {
        const ink = token(group === 'approved' ? '--neutral-100' : '--neutral-900')
        const fill = token(GROUPS[group].token)
        const land = token('--map-background')
        // The same pin toned down toward the land color: it keeps its hue, so the status is still readable.
        return [false, true].map(async (dim) =>
          map.addImage(badgeId(category, group, dim), await badge(Icon, dim ? mix(fill, land, KEEP) : fill, dim ? mix(ink, land, KEEP) : ink, outline, tail)),
        )
      }),
    ),
  )
}

/** Persistent-problem marker (decision 0030; owner's test 2026-10-30): a 32 px circle in the problem's status color with the category icon in it and a 2 px neutral-900 outline, and a small round alert badge (neutral-700, outlined neutral-400) on its upper right. The occurrence count is not drawn here: it shows in the card you get by hovering the problem. One image per category and status. */
export const problemMarkerId = (category: string, status: string) => `problem-${iconCategory(category)}-${status}`
/** The image is drawn at 2x and shown at half size, so the circle is 32 px on screen. */
export const PROBLEM_SCALE = 0.5
const OUTLINE_PX = 2 // the circle's outline, outside, in screen px: neutral-900
const PAD = Math.ceil(OUTLINE_PX / PROBLEM_SCALE) // image px kept free left of and below the circle so the outline is not cut off
const CIRCLE = { x: 32 + PAD, y: 60 } // the circle's center, in image px (radius 32)
const BADGE = { x: CIRCLE.x + 30, y: CIRCLE.y - 30, r: 20 } // the alert badge, 20 px on screen
const IMAGE_SIZE = { w: BADGE.x + BADGE.r + 2, h: 92 + PAD }
/** Puts the circle (not the whole image with its badge) on the spot. */
export const PROBLEM_OFFSET: [number, number] = [IMAGE_SIZE.w / 2 - CIRCLE.x, IMAGE_SIZE.h / 2 - CIRCLE.y]

async function drawIcon(Icon: (typeof ICONS)[keyof typeof ICONS] | typeof Warning, color: string, size: number) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(createElement(Icon, { color, width: size, height: size, weight: 'fill' })))}`
  await img.decode()
  return img
}

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], status: string) {
  const [icon, alert] = await Promise.all([drawIcon(Icon, token('--neutral-900'), 48), drawIcon(Warning, token('--neutral-100'), 24)])
  const c = document.createElement('canvas')
  c.width = IMAGE_SIZE.w
  c.height = IMAGE_SIZE.h
  const g = c.getContext('2d')!
  g.beginPath() // the circle, with an outline outside it: stroke twice as wide, then paint the fill over the inner half
  g.arc(CIRCLE.x, CIRCLE.y, 32, 0, Math.PI * 2)
  g.lineWidth = (OUTLINE_PX / PROBLEM_SCALE) * 2
  g.strokeStyle = token('--neutral-900')
  g.stroke()
  g.fillStyle = token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token)
  g.fill()
  g.drawImage(icon, CIRCLE.x - 24, CIRCLE.y - 24, 48, 48)
  g.beginPath() // the alert badge: a round version of the Figma count pill, a 2 px outline inside
  g.arc(BADGE.x, BADGE.y, BADGE.r, 0, Math.PI * 2)
  g.fillStyle = token('--neutral-700')
  g.fill()
  g.beginPath()
  g.arc(BADGE.x, BADGE.y, BADGE.r - 2, 0, Math.PI * 2)
  g.lineWidth = 4
  g.strokeStyle = token('--neutral-400')
  g.stroke()
  g.drawImage(alert, BADGE.x - 12, BADGE.y - 12, 24, 24)
  return g.getImageData(0, 0, IMAGE_SIZE.w, IMAGE_SIZE.h)
}

export async function addProblemMarkers(map: { addImage: (id: string, data: ImageData) => void }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).map(async (status) => map.addImage(problemMarkerId(category, status), await problemMarker(Icon, status))),
    ),
  )
}
