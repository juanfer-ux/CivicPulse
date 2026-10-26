import { createElement } from 'react'
import { Car, Trash } from 'iconoir-react'
import { GROUPS, type Group } from '@/lib/incidents'
import { token } from '@/lib/tokens'

/** Street-level markers (Waze style): a big colored circle with the category's icon inside. One image per category and status. */
const ICONS = { parking: Car, illegal_dumping: Trash }
export const iconCategory = (category: string) => (category in ICONS ? category : 'parking')
export const badgeId = (category: string, group: string) => `badge-${iconCategory(category)}-${group}`

const SIZE = 64

/** The icon as an image. Drawn twice per badge: a solid silhouette in `ink`, then the thin outline in the badge color on top, so details (windshield, lid) stay readable. */
async function glyph(Icon: (typeof ICONS)[keyof typeof ICONS], ink: string, strokeWidth: number, fill?: string) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(createElement(Icon, { color: ink, width: 34, height: 34, strokeWidth, fill }))
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  return img
}

async function badge(Icon: (typeof ICONS)[keyof typeof ICONS], fill: string, ink: string, outline: string) {
  const solid = await glyph(Icon, ink, 1.8, ink)
  const lines = await glyph(Icon, fill, 1)
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  const g = c.getContext('2d')!
  g.beginPath()
  g.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2)
  g.fillStyle = fill
  g.fill()
  g.lineWidth = 2
  g.strokeStyle = outline
  g.stroke()
  const at = (SIZE - 34) / 2
  g.drawImage(solid, at, at, 34, 34)
  g.drawImage(lines, at, at, 34, 34)
  return g.getImageData(0, 0, SIZE, SIZE)
}

/** Adds every badge to the map. Icon ink is dark, except on Approved (a mid blue) where it is light. */
export async function addBadges(map: { addImage: (id: string, data: ImageData) => void }) {
  const outline = token('--map-dot-outline')
  await Promise.all(
    Object.entries(ICONS).flatMap(([category, Icon]) =>
      (Object.keys(GROUPS) as Group[]).map(async (group) => {
        const ink = token(group === 'approved' ? '--neutral-100' : '--neutral-900')
        map.addImage(badgeId(category, group), await badge(Icon, token(GROUPS[group].token), ink, outline))
      }),
    ),
  )
}
