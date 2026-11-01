import { createElement } from 'react'
import { Car, Trash } from '@phosphor-icons/react'
import { GROUPS, type Group } from '@/lib/incidents'
import { PROBLEM_STATUS } from '@/lib/problems'
import { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_PX, PROBLEM_FAR, RING_EXTRA, problemSizes } from '@/lib/markerSizes'
import { KEEP, mix, token } from '@/lib/tokens'

export { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_BY_ZOOM, PROBLEM_CIRCLE_PX, PROBLEM_SIZE, PROBLEM_SWITCH_ZOOMS, RING_EXTRA, problemSizes } from '@/lib/markerSizes'

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

/** Persistent-problem marker (decision 0030; the owner's option F, 2026-11-01): a neutral-700 circle with a 1 px outline in the problem's status color (softened by 2 px of blur), the category icon in neutral-100 inside, and on its upper right a warning triangle in the status color with a 4 px neutral-900 outline. The sizes are in PROBLEM_FAR (markerSizes.ts), set at the farthest zoom and scaled in proportion for each image size (PROBLEM_CIRCLE_PX). The occurrence count is not drawn here: it shows in the card you get by hovering the problem. One image per category, status and size, each centered on the circle so the layer needs no offset. */
export const problemMarkerId = (category: string, status: string, px: number) => `problem-${iconCategory(category)}-${status}-${px}`

async function drawIcon(Icon: (typeof ICONS)[keyof typeof ICONS], color: string, size: number) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(createElement(Icon, { color, width: size, height: size, weight: 'fill' })))}`
  await img.decode()
  return img
}

/** Phosphor's Warning (fill) in two parts: the triangle and the exclamation mark (cut out of it). */
const TRI_BODY = new Path2D('M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z')
const TRI_MARK = new Path2D('M120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z')

async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], status: string, size: number) {
  const { circle, iconPx, badgeD, alertOutline, up } = problemSizes(size)
  const statusColor = token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token)
  const off = (circle / 2 + PROBLEM_FAR.badgeGap) / Math.SQRT2 // the triangle's center, on the diagonal from the circle's edge...
  const half = Math.ceil(Math.max(circle / 2 + PROBLEM_FAR.outline + PROBLEM_FAR.outlineBlur, off + up + badgeD / 2 + alertOutline)) + 1 // screen px from the circle's center to the image edge, on every side
  const side = half * 2 * PR
  const icon = await drawIcon(Icon, token('--neutral-100'), iconPx * PR)
  const c = document.createElement('canvas')
  c.width = c.height = side
  const g = c.getContext('2d')!
  const mid = side / 2
  g.beginPath() // the circle, with its outline outside it: stroke twice as wide (with a soft edge), then paint the fill over the inner half
  g.arc(mid, mid, (circle / 2) * PR, 0, Math.PI * 2)
  g.lineWidth = PROBLEM_FAR.outline * PR * 2
  g.strokeStyle = statusColor
  g.shadowColor = statusColor
  g.shadowBlur = PROBLEM_FAR.outlineBlur * PR
  g.stroke()
  g.shadowBlur = 0
  g.fillStyle = token('--neutral-700')
  g.fill()
  g.drawImage(icon, mid - (iconPx * PR) / 2, mid - (iconPx * PR) / 2, iconPx * PR, iconPx * PR)
  // the warning triangle: ...and a little higher, so it overlaps the circle less vertically
  g.save()
  g.translate(mid + off * PR - (badgeD * PR) / 2, mid - (off + up) * PR - (badgeD * PR) / 2)
  g.scale((badgeD * PR) / 256, (badgeD * PR) / 256)
  g.lineJoin = 'round'
  g.lineWidth = (2 * alertOutline * 256) / badgeD
  g.strokeStyle = token('--neutral-900')
  g.stroke(TRI_BODY) // outline outside: stroke twice as wide, then the fill covers the inner half
  g.fillStyle = statusColor
  g.fill(TRI_BODY)
  g.fillStyle = token('--neutral-900')
  g.fill(TRI_MARK)
  g.restore()
  return g.getImageData(0, 0, side, side)
}

export async function addProblemMarkers(map: { addImage: AddImage }) {
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).flatMap((status) => PROBLEM_CIRCLE_PX.map(async (px) => put(map, problemMarkerId(category, status, px), await problemMarker(Icon, status, px)))),
    ),
  )
}
