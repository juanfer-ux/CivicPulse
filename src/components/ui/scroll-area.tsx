"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

/** The app's scrollbar (owner, 2026-11-05; 12 px since 2026-11-12, so the thumb is 4 px from the edge): 12 px grab area with a 4 px round thumb (6 px on hover), neutral-400 (neutral-300 on hover), always visible, no track (style G). Same look as the global CSS rule for native scrollbars. */
function ScrollArea({
  className,
  children,
  barClassName,
  thumbClassName,
  viewportClassName,
  viewportRef,
  horizontal,
  type = "always",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & { barClassName?: string; thumbClassName?: string; viewportClassName?: string; viewportRef?: React.Ref<HTMLDivElement>; horizontal?: boolean }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type={type}
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className={cn("size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1", viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar className={barClassName} thumbClassName={thumbClassName} />
      {horizontal && <ScrollBar orientation="horizontal" className={barClassName} thumbClassName={thumbClassName} />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  thumbClassName,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & { thumbClassName?: string }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-[4px] transition-[color,padding] select-none hover:p-[3px] data-horizontal:h-3 data-horizontal:flex-col data-vertical:h-full data-vertical:w-3",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn("relative flex-1 rounded-full bg-(--neutral-400) hover:bg-(--neutral-300)", thumbClassName)}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
