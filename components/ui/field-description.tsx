import * as React from "react"
import { cn } from "@/lib/utils"

interface FieldDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const FieldDescription = React.forwardRef<HTMLParagraphElement, FieldDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FieldDescription.displayName = "FieldDescription"

export { FieldDescription } 