import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Auth Card: 64px ring mark, 16px gap (a quarter of the mark, owner 2026-11-02; it was 7.58px), 236.6x18 wordmark (it shrinks, keeping its proportions, when the card is narrower than the lockup, as on a phone). `compact` is the sign-in screen's size: 48px mark, 12px gap, 177.8x13.5 wordmark. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'} ${className ?? ''}`}>
      <img src={mark} alt="" width={compact ? 48 : 64} height={compact ? 48 : 64} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${compact ? 'w-[177.8px]' : 'w-[236.6px]'}`} />
    </div>
  )
}
