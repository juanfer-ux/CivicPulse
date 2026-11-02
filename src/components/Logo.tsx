import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Auth Card: 56px ring mark, 14px gap (a quarter of the mark, owner 2026-11-02; it was 7.58px), 207.4x15.75 wordmark (it shrinks, keeping its proportions, when the card is narrower than the lockup, as on a phone). `compact` is the sign-in screen's size: 48px mark, 12px gap, 177.8x13.5 wordmark. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-3.5'} ${className ?? ''}`}>
      <img src={mark} alt="" width={compact ? 48 : 56} height={compact ? 48 : 56} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${compact ? 'w-[177.8px]' : 'w-[207.4px]'}`} />
    </div>
  )
}
