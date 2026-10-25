import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'iconoir-react'
import authImage from '@/assets/auth-aura-still.jpg'
import authVideo from '@/assets/auth-aura.mp4'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/** Value proposition next to the card on desktop (Figma Auth_Image container). The picture is the looping src/assets/auth-aura.mp4 over its own first frame, src/assets/auth-aura-still.jpg (shown before it loads and for reduced motion), at every screen width: re-export the still when the video changes (decision 0021). */
const HEADLINE = 'Street incidents, turned into decisions.'
const SUBTITLE = 'AI agents connect scattered incidents into patterns and recommend an intervention, with the evidence behind it.'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Page shared by Sign in and Set up your account (Figma: Auth Panel + Auth_Image container). Children go inside the centered Auth Card; `mobileLogo` puts the logo above the panel on phones (sign in does, set up does not in Figma); `footer` is the small line under the card on desktop (sign in only in Figma). */
export function AuthLayout({ children, mobileLogo, footer }: { children: ReactNode; mobileLogo?: boolean; footer?: string }) {
  const video = useRef<HTMLVideoElement>(null)
  // Never autoplays when the system asks for reduced motion.
  const [playing, setPlaying] = useState(() => !window.matchMedia(REDUCED_MOTION).matches)
  const toggle = () => (video.current?.paused ? video.current.play() : video.current?.pause())
  // iPhone Low Power Mode blocks autoplay: keep the still and let the button say Play.
  useEffect(() => {
    if (!window.matchMedia(REDUCED_MOTION).matches) video.current?.play().catch(() => setPlaying(false))
  }, [])
  const pauseButton = (className: string) => (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={playing ? 'Pause background animation' : 'Play background animation'} className={cn('absolute text-muted-foreground', className)}>
      {playing ? <Pause /> : <Play />}
    </Button>
  )

  return (
    <main className={cn('relative isolate flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-4 desk:flex-row desk:gap-0 desk:p-10', mobileLogo ? 'py-10' : 'py-4')}>
      <img src={authImage} alt="" className="absolute inset-0 -z-20 size-full object-cover object-top" />
      <video
        ref={video}
        src={authVideo}
        poster={authImage}
        autoPlay={playing}
        loop
        muted
        playsInline
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 -z-10 size-full object-cover object-top"
      />
      {mobileLogo && <Logo compact className="desk:hidden" />}
      {/* The form comes first in the page order (keyboard and screen readers reach it first); `order` puts the picture column back on the left on desktop. */}
      <div className={cn('flex w-full max-w-[640px] flex-col items-center rounded-xl py-6 desk:order-2 desk:min-w-[450px] desk:flex-1 desk:self-stretch desk:bg-background/25 desk:px-4 desk:backdrop-blur-[6px]', mobileLogo && 'max-desk:flex-1')}>
        <Card className="w-full max-w-[460px] flex-1 justify-center gap-0 border-0 bg-transparent">{children}</Card>
        {footer && <p className="hidden text-center text-caption text-closed desk:block">{footer}</p>}
      </div>
      <section className="relative hidden min-w-[850px] flex-1 flex-col justify-between self-stretch p-0.5 desk:order-1 desk:flex">
        <Logo compact />
        <div className="flex max-w-[640px] flex-col gap-10 px-2.5 py-6">
          <p className="text-[64px] leading-[68px] font-extralight tracking-[-0.014em] text-foreground">{HEADLINE}</p>
          <p className="text-title font-medium text-muted-foreground">{SUBTITLE}</p>
        </div>
        {pauseButton('right-0.5 bottom-0.5')}
      </section>
      {pauseButton('top-1 right-1 desk:hidden')}
    </main>
  )
}
