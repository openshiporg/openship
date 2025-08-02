import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const standardBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const coloredBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      color: {
        white: "bg-white text-black border-muted-foreground/20 dark:border-muted-foreground/10",
        red: "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-900/50",
        orange: "bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
        amber: "bg-amber-400/20 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
        yellow: "bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50",
        lime: "bg-lime-400/20 text-lime-700 dark:bg-lime-400/10 dark:text-lime-300 border-lime-200 dark:border-lime-900/50",
        green: "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-300 dark:border-green-900/50",
        emerald: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
        teal: "bg-teal-500/15 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 border-teal-200 dark:border-teal-900/50",
        cyan: "bg-cyan-400/20 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/50",
        sky: "bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200 dark:border-sky-900/50",
        blue: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
        indigo: "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
        violet: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
        purple: "bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
        fuchsia: "bg-fuchsia-400/15 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-900/50",
        pink: "bg-pink-400/15 text-pink-700 dark:bg-pink-400/10 dark:text-pink-400 border-pink-200 dark:border-pink-900/50",
        rose: "bg-rose-400/15 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
        zinc: "bg-zinc-500/10 text-zinc-500/90 dark:bg-white/5 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700/50",
      }
    }
  }
)

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & (
  | { variant?: VariantProps<typeof standardBadgeVariants>["variant"]; color?: never }
  | { color?: VariantProps<typeof coloredBadgeVariants>["color"]; variant?: never }
)

function Badge({ className, variant, color, ...props }: BadgeProps) {
  // If color is provided, use colored variant, otherwise use standard variant
  const classes = color 
    ? coloredBadgeVariants({ color }) 
    : standardBadgeVariants({ variant })

  return <div className={cn(classes, className)} {...props} />
}

export { Badge, standardBadgeVariants, coloredBadgeVariants }

