import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma Auth Card: 72px ring mark, 7.6px gap, 266.6x20.25 wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[7.58px] ${className ?? ''}`}>
      <img src={mark} alt="" width={72} height={72} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" className="h-[20.25px] w-[266.6px] shrink-0" />
    </div>
  )
}
