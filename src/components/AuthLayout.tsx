import type { ReactNode } from 'react'
import authImage from '@/assets/auth-image.png'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/ui/card'

/** Value proposition next to the card on desktop (Figma Auth_Image container). The picture is src/assets/auth-image.png: replace the file to change it. */
const HEADLINE = 'Street incidents, turned into decisions.'
const SUBTITLE = 'AI agents connect scattered incidents into patterns and recommend an intervention, with the evidence behind it.'

/** Page shared by Sign in and Set up your account (Figma: Auth Panel + Auth_Image container). Children go inside the centered Auth Card; `mobileLogo` puts the logo above the card on phones (sign in does, set up does not in Figma). */
export function AuthLayout({ children, mobileLogo }: { children: ReactNode; mobileLogo?: boolean }) {
  return (
    <main className="relative isolate flex min-h-svh justify-center bg-background px-4 desk:gap-0 desk:p-10">
      <img src={authImage} alt="" className="absolute inset-0 -z-10 hidden size-full object-cover object-center desk:block" />
      <section className="hidden min-w-[850px] flex-1 flex-col justify-between self-stretch p-0.5 desk:flex">
        <Logo compact />
        <div className="flex max-w-[640px] flex-col gap-10 p-2.5">
          <h1 className="text-[64px] leading-[68px] font-extralight tracking-[-0.014em] text-foreground">{HEADLINE}</h1>
          <p className="text-title font-medium text-muted-foreground">{SUBTITLE}</p>
        </div>
      </section>
      <div className="flex w-full flex-1 justify-center max-desk:flex-col max-desk:items-center max-desk:py-10 desk:min-w-[450px] desk:max-w-[640px] desk:self-stretch desk:rounded-xl desk:bg-background desk:px-4 desk:py-6">
        {mobileLogo && <Logo compact className="desk:hidden" />}
        <Card className="w-full max-w-[460px] justify-center gap-0 border-0 bg-transparent max-desk:flex-1">{children}</Card>
      </div>
    </main>
  )
}
