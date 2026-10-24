import { useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'iconoir-react'
import authImage from '@/assets/auth-image.png'
import authVideo from '@/assets/auth-aura.mp4'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/** Value proposition next to the card on desktop (Figma Auth_Image container). The picture is the still src/assets/auth-image.png (Figma's frame, the poster, the phone-free fallback) with the looping src/assets/auth-aura.mp4 on top: replace the files to change them (decision 0021). */
const HEADLINE = 'Street incidents, turned into decisions.'
const SUBTITLE = 'AI agents connect scattered incidents into patterns and recommend an intervention, with the evidence behind it.'

/** Page shared by Sign in and Set up your account (Figma: Auth Panel + Auth_Image container). Children go inside the centered Auth Card; `mobileLogo` puts the logo above the card on phones (sign in does, set up does not in Figma). */
export function AuthLayout({ children, mobileLogo }: { children: ReactNode; mobileLogo?: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  // The video is only mounted on desktop widths (phones never download it) and never autoplays when the system asks for reduced motion.
  const [showVideo] = useState(() => window.matchMedia('(min-width: 90rem)').matches)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const toggle = () => (video.current?.paused ? video.current.play() : video.current?.pause())

  return (
    <main className="relative isolate flex min-h-svh justify-center bg-background px-4 desk:gap-0 desk:p-10">
      <img src={authImage} alt="" className="absolute inset-0 -z-20 hidden size-full object-cover object-top desk:block" />
      {showVideo && (
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
      )}
      <section className="relative hidden min-w-[850px] flex-1 flex-col justify-between self-stretch p-0.5 desk:flex">
        {showVideo && (
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={playing ? 'Pause background animation' : 'Play background animation'} className="absolute right-0.5 bottom-0.5 text-muted-foreground">
            {playing ? <Pause /> : <Play />}
          </Button>
        )}
        <Logo compact />
        <div className="flex max-w-[640px] flex-col gap-10 p-2.5">
          <h1 className="text-[64px] leading-[68px] font-extralight tracking-[-0.014em] text-foreground">{HEADLINE}</h1>
          <p className="text-title font-medium text-muted-foreground">{SUBTITLE}</p>
        </div>
      </section>
      <div className="flex w-full flex-1 justify-center max-desk:flex-col max-desk:items-center max-desk:py-10 desk:min-w-[450px] desk:max-w-[640px] desk:self-stretch desk:rounded-xl desk:bg-background/55 desk:px-4 desk:py-6">
        {mobileLogo && <Logo compact className="desk:hidden" />}
        <Card className="w-full max-w-[460px] justify-center gap-0 border-0 bg-transparent max-desk:flex-1">{children}</Card>
      </div>
    </main>
  )
}
