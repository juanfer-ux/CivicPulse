import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Auth Card: 72px ring mark, 7.6px gap, 266.6x20.25 wordmark (it shrinks, keeping its proportions, when the card is narrower than the lockup, as on a phone). `large` is the sign-in size: 75.3px mark, 7.9px gap, 278.7x21.2 wordmark. */
export function Logo({ className, large }: { className?: string; large?: boolean }) {
  return (
    <div className={`flex items-center ${large ? 'gap-[7.93px]' : 'gap-[7.58px]'} ${className ?? ''}`}>
      <img src={mark} alt="" width={large ? 75.3 : 72} height={large ? 75.3 : 72} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className={`h-auto min-w-0 ${large ? 'w-[278.7px]' : 'w-[266.6px]'}`} />
    </div>
  )
}
