import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Sign in screen (owner, 2026-11-03): 48px ring mark, 13.24px gap, 196.1x14.9 wordmark (the one 58 / 16 / 237x18 Logo component at 82.7%; the wordmark shrinks, keeping its proportions, when the card is narrower than the lockup). `compact` is the phone's size, the same lockup at 75%: 43.5px mark, 12px gap, 177.8x13.5 wordmark. The mark art is cropped to the ring; the sidebar and the phone top bar use the same file and the same component at their own scale. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-[13.24px]'} ${className ?? ''}`}>
      <img src={mark} alt="" width={compact ? 43.5 : 48} height={compact ? 43.5 : 48} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${compact ? 'w-[177.8px]' : 'w-[196.1px]'}`} />
    </div>
  )
}
