import { createElement } from 'react'
import { Car, Trash } from '@phosphor-icons/react'
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

/** Persistent-problem marker (decision 0030; Figma Problem Marker): a light disc with a status-colored ring and a small badge with the category's icon. The occurrence count is drawn over the disc by the layer. One image per category and status. */
export const problemMarkerId = (category: string, status: string) => `problem-${iconCategory(category)}-${status}`
const P = 96 // image px; shown at 0.5, so 48 px like Figma
/** Where the disc's center sits in the image, so the layer can center the count on it. */
export const PROBLEM_CENTER = 44

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], ring: string) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: token('--neutral-100'), width: 24, height: 24, weight: 'fill' }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = c.height = P
  const g = c.getContext('2d')!
  g.beginPath() // the disc
  g.arc(PROBLEM_CENTER, PROBLEM_CENTER, 40, 0, Math.PI * 2)
  g.fillStyle = token('--neutral-100')
  g.fill()
  g.beginPath() // the ring sits inside the disc's edge
  g.arc(PROBLEM_CENTER, PROBLEM_CENTER, 37, 0, Math.PI * 2)
  g.lineWidth = 6
  g.strokeStyle = ring
  g.stroke()
  g.beginPath() // the category badge, bottom right, with a thin light outline
  g.arc(76, 76, 20, 0, Math.PI * 2)
  g.lineWidth = 3
  g.strokeStyle = token('--neutral-100')
  g.stroke()
  g.fillStyle = token('--neutral-900')
  g.fill()
  g.drawImage(img, 64, 64, 24, 24)
  return g.getImageData(0, 0, P, P)
}

export async function addProblemMarkers(map: { addImage: (id: string, data: ImageData) => void }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.entries(PROBLEM_STATUS).map(async ([status, s]) => map.addImage(problemMarkerId(category, status), await problemMarker(Icon, token(s.token)))),
    ),
  )
}
