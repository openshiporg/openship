import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // default:
        //   "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        default: 'hover:bg-primary/90 from-primary to-primary/85 text-primary-foreground dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 shadow-md shadow-zinc-950/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 dark:border-t-0 dark:border-zinc-950/50 dark:ring-white/5',
        // destructive:
        //   "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        destructive: 'from-destructive to-destructive/85 text-white dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 shadow-md shadow-zinc-950/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 dark:border-t-0 dark:border-zinc-950/50 dark:ring-white/5',
        // outline:
        //   "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        outline: 'bg-background hover:bg-muted/50 dark:ring-input border-input/50 dark:border-input relative border-b-2 shadow-sm shadow-zinc-950/15 ring-1 ring-zinc-300',
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
