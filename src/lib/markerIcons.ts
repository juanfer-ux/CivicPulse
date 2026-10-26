import { createElement } from 'react'
import { Car, Trash } from '@phosphor-icons/react'
import { GROUPS, type Group } from '@/lib/incidents'
import { token } from '@/lib/tokens'

/** Street-level markers (Waze style): a big colored circle with the category's icon inside. One image per category and status. */
const ICONS = { parking: Car, illegal_dumping: Trash }
export const iconCategory = (category: string) => (category in ICONS ? category : 'parking')
export const badgeId = (category: string, group: string) => `badge-${iconCategory(category)}-${group}`

/** The badge is a pin: a 64 px circle with a point below it, so the tip marks the exact spot (the layer anchors the image at its bottom). */
const SIZE = 64
/** Length of the pin's point, in image px (displayed at 0.4 to 0.8 of this, depending on zoom). */
export const TAIL = 8
export const PIN_CENTER = SIZE / 2 // circle center, in image px from the top (the circle is at the top)
export const PIN_RISE = SIZE - 2 - PIN_CENTER + TAIL // image px from the tip up to the circle center

async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string, tail = TAIL) {
  const height = SIZE + tail
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: ink, width: 34, height: 34, weight: 'fill' }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = height
  const g = c.getContext('2d')!
  const r = SIZE / 2 - 2
  g.beginPath()
  g.arc(SIZE / 2, PIN_CENTER, r, Math.atan2(0.75 * r, -0.67 * r), Math.PI * 2 + Math.atan2(0.75 * r, 0.67 * r))
  g.lineTo(SIZE / 2, SIZE - 2 + tail)
  g.closePath()
  g.fillStyle = fill
  g.fill()
  g.lineWidth = 2
  g.strokeStyle = outline
  g.stroke()
  g.drawImage(img, (SIZE - 34) / 2, PIN_CENTER - 17, 34, 34)
  return g.getImageData(0, 0, SIZE, height)
}

/** Adds every badge to the map. Icon ink is dark, except on Approved (a mid blue) where it is light. */
export async function addBadges(map: { addImage: (id: string, data: ImageData) => void }, tail = TAIL) {
  const outline = token('--map-dot-outline')
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      [...(Object.keys(GROUPS) as Group[]), 'dimmed' as const].map(async (group) => {
        const ink = token(group === 'approved' ? '--neutral-100' : '--neutral-900')
        const fill = token(group === 'dimmed' ? '--map-dimmed' : GROUPS[group].token)
        map.addImage(badgeId(category, group), await badge(Icon, fill, ink, outline, tail))
      }),
    ),
  )
}
