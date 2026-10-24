import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Auth Card: 72px ring mark, 7.6px gap, 266.6x20.25 wordmark (it shrinks, keeping its proportions, when the card is narrower than the lockup, as on a phone). `compact` is the sign-in size: 67.5px mark, 7.11px gap, 250x19 wordmark. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-[7.11px]' : 'gap-[7.58px]'} ${className ?? ''}`}>
      <img src={mark} alt="" width={compact ? 67.5 : 72} height={compact ? 67.5 : 72} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${compact ? 'w-[250px]' : 'w-[266.6px]'}`} />
    </div>
  )
}
