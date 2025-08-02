import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldLabelProps extends React.ComponentProps<typeof Label> {
  children: React.ReactNode
}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="mb-1">
        <Label
          ref={ref}
          className={cn("text-sm font-medium", className)}
          {...props}
        >
          {children}
        </Label>
      </div>
    )
  }
)
FieldLabel.displayName = "FieldLabel"

export { FieldLabel } 