import { createElement } from 'react'
import { Car, Trash } from '@phosphor-icons/react'
import { GROUPS, PROBLEM_STATUS, type Group } from '@/lib/statusColors'
import { BADGE_STEPS, PLAIN_PX, PROBLEM_CIRCLE_PX, PROBLEM_FAR, RING_EXTRA, problemSizes, triangleOffset } from '@/lib/markerSizes'
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

/** The far-zoom marker: a plain circle (it was a square until 2026-11-01) in the status color with an outline (a 1/8 border), one image per size (PLAIN_PX), status and a toned-down version. */
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
        g.beginPath()
        g.arc(side / 2, side / 2, side / 2, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = dim ? mix(token(GROUPS[group].token), land, KEEP) : token(GROUPS[group].token)
        g.beginPath()
        g.arc(side / 2, side / 2, side / 2 - b, 0, Math.PI * 2)
        g.fill()
        put(map, dotId(group, dim, step), g.getImageData(0, 0, side, side))
      }
    }
  })
}

/** The ring around the selected incident (owner, 2026-10-30): an empty circle outline (a square until 2026-11-01), 2 px on screen, 10 px bigger than the marker; one image per marker size. */
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
    g.beginPath()
    g.arc(side / 2, side / 2, (side - lw) / 2, 0, Math.PI * 2)
    g.stroke()
    put(map, selectedRingId(step), g.getImageData(0, 0, side, side))
  })
}

/** The car seen from above and parked at 45 degrees, the icon of a Pending parking incident (owner's Figma, 2026-11-13: Incident Marker, status=pending, icon-24 and icon-30; an 18 x 18 vector in `neutral-900`, 14 px in the 24 px circle and 18 px in the 30 px one, so the Phosphor icon's size plus 2). The other statuses and the dumping markers keep the Phosphor icons. */
const CAR_DIAGONAL = new Path2D('M1.2795 2.8658L0.000362611 5.11816L0.345374 6.4034L2.89284 8.96749C2.40548 9.69028 2.10279 10.0822 2.59695 10.3474L3.26905 9.34371L10.8445 16.9767L12.2033 17.1821C13.8843 15.7811 15.7814 13.884 17.1784 12.207L16.9731 10.8482L9.34407 3.26868L10.3316 2.61279C10.0698 2.12209 9.67806 2.41769 8.97132 2.89593L6.40377 0.345009L5.11853 -2.89129e-06L2.86616 1.27913C2.81306 1.32454 1.3249 2.8127 1.2795 2.8658ZM15.3178 11.5156L13.5519 9.9625C12.0518 11.4626 11.4755 12.0389 9.96287 13.5516L11.516 15.3174C13.1717 13.6617 13.6621 13.1713 15.3178 11.5156ZM9.86135 5.56877L9.0608 3.86893C7.95418 4.35622 7.23773 4.56336 6.37841 5.51116C5.4094 6.48017 6.48075 5.40882 5.51152 6.37804C4.56394 7.23715 4.35253 7.95787 3.86887 9.06086L5.56871 9.86141C6.04422 8.68502 8.67787 6.04444 9.86135 5.56877ZM9.82981 4.53091L10.2828 5.67125L13.5747 9.14269L13.7789 8.79081L13.4186 8.10396L9.82981 4.53091ZM4.53149 9.82923L5.66757 10.2865L9.139 13.5784L8.79118 13.7785L8.10432 13.4183L4.53149 9.82923Z')

async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string, square: number, iconPx: number, diagonal = false) {
  const icon = diagonal ? null : await drawIcon(Icon, ink, iconPx * PR)
  const side = square * PR
  const b = square * OUTLINE * PR
  const c = document.createElement('canvas')
  c.width = c.height = side
  const g = c.getContext('2d')!
  g.beginPath() // the circle (it was a square until 2026-11-01); the outline sits outside it, so the whole marker fits in the image
  g.arc(side / 2, side / 2, side / 2 - b, 0, Math.PI * 2)
  // Outside outline: stroke twice as wide, then paint the fill over its inner half.
  g.lineWidth = b * 2
  g.strokeStyle = outline
  g.stroke()
  g.fillStyle = fill
  g.fill()
  if (icon) g.drawImage(icon, (side - iconPx * PR) / 2, (side - iconPx * PR) / 2, iconPx * PR, iconPx * PR)
  else {
    const k = ((iconPx + 2) * PR) / 18 // the drawing's 18 units to its size on screen
    g.translate(side / 2 - 9 * k, side / 2 - 9 * k)
    g.scale(k, k)
    g.fillStyle = ink
    g.fill(CAR_DIAGONAL, 'evenodd')
  }
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
          [false, true].map(async (dim) => put(map, badgeId(category, group, dim, step), await badge(Icon, dim ? mix(fill, land, KEEP) : fill, dim ? mix(ink, land, KEEP) : ink, outline, st.square, st.icon, category === 'parking' && group === 'pending' && st.icon >= 12))),
        )
      }),
    ),
  )
}

/** Recurrence marker (decision 0030; the owner's option F, 2026-11-01): a neutral-900 circle (neutral-700 until 2026-11-07) with a 1 px outline in the problem's status color (softened by 2 px of blur), the category icon in neutral-100 inside, and on its upper right a warning triangle in the status color with a 4 px neutral-900 outline. The sizes are in PROBLEM_FAR (markerSizes.ts), set at the farthest zoom and scaled in proportion for each image size (PROBLEM_CIRCLE_PX). The occurrence count is not drawn here: it shows in the card you get by hovering the problem. One image per category, status and size, each centered on the circle so the layer needs no offset. */
/** The Active parking marker with its circle (owner's test, 2026-11-13): shown while the pointer is over it and while its recurrence is open. */
export const problemCircledId = (px: number) => `problem-parking-active-circle-${px}`
export const problemMarkerId = (category: string, status: string, px: number, dim = false) => `problem-${iconCategory(category)}${dim ? '-dim' : ''}-${status}-${px}`

async function drawIcon(Icon: (typeof ICONS)[keyof typeof ICONS], color: string, size: number) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(createElement(Icon, { color, width: size, height: size, weight: 'fill' })))}`
  await img.decode()
  return img
}

/** The car seen from the front, the icon of an Active parking recurrence (owner's Figma, 2026-11-13: Recurrence Marker, category=parking, status=active; a 25 x 44 vector in `brand-primary` with a 2.375 px `neutral-900` outline and NO circle behind it (Figma 2026-11-13, all three sizes), 44 px tall at the 57 px size and 28 px at the 38 px one, so 0.75 of the circle size; the warning triangle stays where it was). The other statuses and the dumping markers keep the Phosphor icons. */
const CAR_FRONT = new Path2D('M9.6795 0.00997353L4.17277 1.69218L2.70666 4.51004L2.68073 13.3453C0.793731 13.7522 -0.289397 13.9065 0.0676559 15.219L2.68073 14.6458L2.59097 40.9335L4.38953 43.637C9.19545 44.121 15.1118 44.121 19.9051 43.637L21.7036 40.9335L21.6265 14.6458L24.189 15.219C24.5461 13.9184 23.4743 13.7522 21.6265 13.3573L21.6006 4.51004L20.1344 1.69218L14.6277 0.00997353C14.4741 -0.00332451 9.8331 -0.00332451 9.6795 0.00997353ZM18.0819 39.226L17.7501 33.4892C13.0718 33.4892 11.2746 33.4892 6.55712 33.4892L6.22533 39.226C11.389 39.226 12.9182 39.226 18.0819 39.226ZM18.8465 19.5156L20.2488 15.1937C17.7634 14.1232 16.3232 13.2429 13.5054 13.3958C10.4834 13.3958 13.8245 13.3958 10.8019 13.3958C7.98466 13.2429 6.53118 14.1232 4.05708 15.1937L5.45936 19.5156C8.0352 18.3041 16.2594 18.2922 18.8465 19.5156ZM20.4157 17.6672L19.3439 20.4212L19.064 32.1115L19.931 31.8562L20.4403 30.0463L20.4157 17.6672ZM3.89218 17.6672L4.95071 20.4212L5.23063 32.1115L4.37623 31.8562L3.86691 30.0463L3.89218 17.6672Z')

/** Phosphor's Warning (fill) in two parts: the triangle and the exclamation mark (cut out of it). */
const TRI_BODY = new Path2D('M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z')
const TRI_MARK = new Path2D('M120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z')

/** `dim` is the toned-down image (owner, 2026-11-09), drawn while another recurrence is open: every color mixed toward the land color at KEEP, opaque, like the incidents' dim images (opacity would let the map show through). */
async function problemMarker(Icon: (typeof ICONS)[keyof typeof ICONS], category: string, status: string, size: number, dim = false, circled = false) {
  const land = token('--map-background')
  const tone = (color: string) => (dim ? mix(color, land, KEEP) : color)
  const { circle, iconPx, badgeD, alertOutline } = problemSizes(size)
  const statusColor = tone(token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].token))
  const outlineColor = tone(token(PROBLEM_STATUS[status as keyof typeof PROBLEM_STATUS].outline)) // the 600 step (owner, 2026-11-07); the triangle keeps the 300 step
  const carFront = category === 'parking' && status === 'active'
  const tri = triangleOffset(size, carFront) // the triangle's center from the circle's center (an Active parking recurrence has it at the right, owner's Figma 2026-11-13)
  const ringD = circled ? Math.floor(circle * 1.125) : circle // the hover circle is 1.5 times the car: 42, 56 and 64 px for the 28, 38 and 44 px cars (owner's Figma, 2026-11-13); the triangle stays where it is
  const half = Math.ceil(Math.max(ringD / 2 + PROBLEM_FAR.outline + PROBLEM_FAR.outlineBlur, Math.max(Math.abs(tri.x), Math.abs(tri.y)) + badgeD / 2 + alertOutline)) + 1 // screen px from the circle's center to the image edge, on every side
  const side = half * 2 * PR
  const icon = carFront ? null : await drawIcon(Icon, tone(token('--neutral-100')), iconPx * PR)
  const c = document.createElement('canvas')
  c.width = c.height = side
  const g = c.getContext('2d')!
  const mid = side / 2
  if (!carFront || circled) {
    g.beginPath() // the circle, with its outline outside it: stroke twice as wide (with a soft edge), then paint the fill over the inner half
    g.arc(mid, mid, (ringD / 2) * PR, 0, Math.PI * 2)
    g.lineWidth = PROBLEM_FAR.outline * PR * 2
    g.strokeStyle = outlineColor
    g.shadowColor = outlineColor
    g.shadowBlur = PROBLEM_FAR.outlineBlur * PR
    g.stroke()
    g.shadowBlur = 0
    g.fillStyle = tone(token('--neutral-900')) // the disc (owner, 2026-11-07; it was neutral-700)
    g.fill()
  }
  if (icon) g.drawImage(icon, mid - (iconPx * PR) / 2, mid - (iconPx * PR) / 2, iconPx * PR, iconPx * PR)
  else {
    const h = circle * 0.75 * PR
    g.save()
    g.translate(mid, mid)
    g.rotate((-35 * Math.PI) / 180) // the car is turned 35 degrees counterclockwise (owner's Figma, 2026-11-13)
    g.translate(-(h * 24.26) / 44 / 2, -h / 2)
    g.scale(h / 44, h / 44)
    g.lineJoin = 'round'
    g.lineWidth = (2 * 2 * PR * 44) / h // a 2 px neutral-900 outline outside the car (it was 2.375): stroke twice as wide, then the fill covers the inner half
    g.strokeStyle = tone(token('--neutral-900'))
    g.stroke(CAR_FRONT)
    g.fillStyle = tone(token('--brand-primary'))
    g.fill(CAR_FRONT, 'evenodd')
    g.restore()
  }
  // the warning triangle: ...and a little higher, so it overlaps the circle less vertically
  g.save()
  g.translate(mid + tri.x * PR - (badgeD * PR) / 2, mid + tri.y * PR - (badgeD * PR) / 2)
  g.scale((badgeD * PR) / 256, (badgeD * PR) / 256)
  g.lineJoin = 'round'
  g.lineWidth = (2 * alertOutline * 256) / badgeD
  g.strokeStyle = tone(token('--neutral-900'))
  g.stroke(TRI_BODY) // outline outside: stroke twice as wide, then the fill covers the inner half
  g.fillStyle = statusColor
  g.fill(TRI_BODY)
  g.fillStyle = tone(token('--neutral-900'))
  g.fill(TRI_MARK)
  g.restore()
  return g.getImageData(0, 0, side, side)
}

export async function addProblemMarkers(map: { addImage: AddImage }) {
  await Promise.all(PROBLEM_CIRCLE_PX.map(async (px) => put(map, problemCircledId(px), await problemMarker(ICONS.parking, 'parking', 'active', px, false, true))))
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      Object.keys(PROBLEM_STATUS).flatMap((status) => PROBLEM_CIRCLE_PX.flatMap((px) => [false, true].map(async (dim) => put(map, problemMarkerId(category, status, px, dim), await problemMarker(Icon, category, status, px, dim))))),
    ),
  )
}
