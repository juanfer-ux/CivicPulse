import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-(--control-default) w-full min-w-0 rounded-sm border border-input bg-card px-3 py-1 text-body transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-label file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-incident aria-invalid:ring-3 aria-invalid:ring-incident/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
