import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/* Sizes, radius and text style follow the CivicPulse Figma file (Components · Button): sm 32, default 36, lg 44 (touch), radius-sm, label text. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-button whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40",
        outline: "border-input bg-inset text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent focus-visible:border-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-(--control-sm) gap-1.5 px-3 text-button-sm",
        default: "h-(--control-default) gap-2 px-4",
        lg: "h-(--control-lg) gap-2 px-5",
        icon: "size-(--control-icon)",
        "icon-lg": "size-(--control-icon-lg)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
