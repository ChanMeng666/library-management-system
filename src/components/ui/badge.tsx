import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline:
          "text-foreground border-border",
        // New variants
        success:
          "border-transparent bg-[#02FF73] text-black shadow-sm",
        warning:
          "border-transparent bg-amber-500 text-black shadow-sm",
        gradient:
          "border-transparent bg-gradient-to-r from-[#02FF73] to-[#09ADAA] text-black shadow-sm",
        // Subtle variants for status indicators
        "success-subtle":
          "border-[#02FF73]/30 bg-[#02FF73]/10 text-[#02FF73] dark:text-[#02FF73]",
        "warning-subtle":
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        "destructive-subtle":
          "border-destructive/30 bg-destructive/10 text-destructive",
        "info-subtle":
          "border-[#09ADAA]/30 bg-[#09ADAA]/10 text-[#09ADAA]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
