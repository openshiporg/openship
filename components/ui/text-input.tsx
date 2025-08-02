import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const TextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <Input
        type={type}
        className={cn("", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
TextInput.displayName = "TextInput"

export { TextInput } 