import mark from '@/assets/logo-mark-lockup.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Sign in screen (owner, 2026-11-03): 50.8px ring mark, 14px gap, 207.4x15.75 wordmark (the 58 / 16 / 237x18 Logo component at 87.5%; the wordmark shrinks, keeping its proportions, when the card is narrower than the lockup). `compact` is the phone's size, the same lockup at 75%: 43.5px mark, 12px gap, 177.8x13.5 wordmark. The mark art is cropped to the ring (its own file, `logo-mark-lockup.svg`); the sidebar uses the roomier `logo-mark.svg`. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-3.5'} ${className ?? ''}`}>
      <img src={mark} alt="" width={compact ? 43.5 : 50.8} height={compact ? 43.5 : 50.8} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${compact ? 'w-[177.8px]' : 'w-[207.4px]'}`} />
    </div>
  )
}
