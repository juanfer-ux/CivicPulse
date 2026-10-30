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

/** Persistent-problem marker (decision 0030; Figma Map Marker `type=selected` + `type=count`, owner's test 2026-10-30): a rounded 32 px tile in the problem's status color with the category icon in it, and a count pill (neutral-700, outlined neutral-400) overhanging its upper right. One image per category and status; the number itself is drawn by the layer. */
export const problemMarkerId = (category: string, status: string) => `problem-${iconCategory(category)}-${status}`
/** The image is drawn at 2x and shown at half size, so the tile is 32 px on screen. */
export const PROBLEM_SCALE = 0.5
/** Image px: the tile's center, and the image's center, so the layer can put the tile (not the image) on the spot. */
const OUTLINE_PX = 2 // the tile's outline, outside, in screen px (owner, 2026-10-30): neutral-900
const PAD = Math.ceil(OUTLINE_PX / PROBLEM_SCALE) // image px kept free left of and below the tile so the outline is not cut off
const TILE_CENTER = { x: 32 + PAD, y: 60 }
const PILL_CENTER = { x: 70 + PAD, y: 22 }
const IMAGE_SIZE = { w: 104 + PAD, h: 92 + PAD }
export const PROBLEM_OFFSET: [number, number] = [IMAGE_SIZE.w / 2 - TILE_CENTER.x, IMAGE_SIZE.h / 2 - TILE_CENTER.y]
/** Where the pill's center is from the tile's center, in screen px, for the number. */
export const PROBLEM_COUNT: [number, number] = [(PILL_CENTER.x - TILE_CENTER.x) * PROBLEM_SCALE, (PILL_CENTER.y - TILE_CENTER.y) * PROBLEM_SCALE]

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], status: string) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: token('--neutral-900'), width: 48, height: 48, weight: 'fill' }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = IMAGE_SIZE.w
  c.height = IMAGE_SIZE.h
  const g = c.getContext('2d')!
  g.beginPath() // the tile, with an outline outside it: stroke twice as wide, then paint the fill over the inner half
  g.roundRect(PAD, 28, 64, 64, 8)
  g.lineJoin = 'round'
  g.lineWidth = (OUTLINE_PX / PROBLEM_SCALE) * 2
  g.strokeStyle = token('--neutral-900')
  g.stroke()
  g.fillStyle = token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token)
  g.fill()
  g.drawImage(img, PAD + 8, 36, 48, 48)
  g.beginPath() // the count pill: 32 x 22, fully rounded, a 2 px outline inside
  g.roundRect(38 + PAD, 0, 64, 44, 22)
  g.fillStyle = token('--neutral-700')
  g.fill()
  g.beginPath()
  g.roundRect(40 + PAD, 2, 60, 40, 20)
  g.lineWidth = 4
  g.strokeStyle = token('--neutral-400')
  g.stroke()
  return g.getImageData(0, 0, IMAGE_SIZE.w, IMAGE_SIZE.h)
}

export async function addProblemMarkers(map: { addImage: (id: string, data: ImageData) => void }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).map(async (status) => map.addImage(problemMarkerId(category, status), await problemMarker(Icon, status))),
    ),
  )
}
