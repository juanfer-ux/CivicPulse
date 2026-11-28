import { Scroll, Sparkle } from '@phosphor-icons/react'
import type { PanelId } from '@/lib/modules'

/** The icon at the left of a sidebar window's title (owner, 2026-11-29): solid, a name tag for the window; the grip at the right is the part you act on (decision 0050). */
export function PanelIcon({ id }: { id: PanelId }) {
  const Icon = id === 'history' ? Scroll : Sparkle
  return <Icon weight="fill" className="size-5 shrink-0 text-(--neutral-300)" aria-hidden />
}
