import mark from '@/assets/logo-mark.svg'
import wordmark from '@/assets/logo-wordmark.svg'

/** Brand lockup from the Figma sign-in frame: 64px ring mark, 6.7px gap, 237x18 wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[6.74px] ${className ?? ''}`}>
      <img src={mark} alt="" width={64} height={64} className="shrink-0" />
      <img src={wordmark} alt="Civic Pulse" width={237} height={18} className="shrink-0" />
    </div>
  )
}
