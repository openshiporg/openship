import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@keystone/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-x-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      color: {
        default: [
          "bg-blue-50 text-blue-900 ring-blue-500/30",
          "dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30",
        ],
        red: [
          "bg-red-50 text-red-900 ring-red-600/20",
          "dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20",
        ],
        orange: [
          "bg-orange-50 text-orange-900 ring-orange-600/20",
          "dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/20",
        ],
        amber: [
          "bg-amber-50 text-amber-900 ring-amber-600/20",
          "dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20",
        ],
        yellow: [
          "bg-yellow-50 text-yellow-900 ring-yellow-600/30",
          "dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20",
        ],
        lime: [
          "bg-lime-50 text-lime-900 ring-lime-600/20",
          "dark:bg-lime-400/10 dark:text-lime-400 dark:ring-lime-400/20",
        ],
        green: [
          "bg-emerald-50 text-emerald-900 ring-emerald-600/30",
          "dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20",
        ],
        emerald: [
          "bg-emerald-50 text-emerald-900 ring-emerald-600/30",
          "dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20",
        ],
        teal: [
          "bg-teal-50 text-teal-900 ring-teal-600/20",
          "dark:bg-teal-400/10 dark:text-teal-400 dark:ring-teal-400/20",
        ],
        cyan: [
          "bg-cyan-50 text-cyan-900 ring-cyan-600/20",
          "dark:bg-cyan-400/10 dark:text-cyan-400 dark:ring-cyan-400/20",
        ],
        sky: [
          "bg-sky-50 text-sky-900 ring-sky-600/20",
          "dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20",
        ],
        blue: [
          "bg-blue-50 text-blue-900 ring-blue-500/30",
          "dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30",
        ],
        indigo: [
          "bg-indigo-50 text-indigo-900 ring-indigo-600/20",
          "dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/20",
        ],
        violet: [
          "bg-violet-50 text-violet-900 ring-violet-600/20",
          "dark:bg-violet-400/10 dark:text-violet-400 dark:ring-violet-400/20",
        ],
        purple: [
          "bg-purple-50 text-purple-900 ring-purple-600/20",
          "dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/20",
        ],
        fuchsia: [
          "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-600/20",
          "dark:bg-fuchsia-400/10 dark:text-fuchsia-400 dark:ring-fuchsia-400/20",
        ],
        pink: [
          "bg-pink-50 text-pink-900 ring-pink-600/20",
          "dark:bg-pink-400/10 dark:text-pink-400 dark:ring-pink-400/20",
        ],
        rose: [
          "bg-rose-50 text-rose-900 ring-rose-600/20",
          "dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20",
        ],
        zinc: [
          "bg-zinc-50 text-zinc-900 ring-zinc-600/20",
          "dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20",
        ],
        gray: [
          "bg-zinc-50 text-zinc-900 ring-zinc-500/30",
          "dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20",
        ],
        slate: [
          "bg-zinc-50 text-zinc-900 ring-zinc-600/20",
          "dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/20",
        ],
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
);

function Badge({ className, color, ...props }) {
  return <div className={cn(badgeVariants({ color }), className)} {...props} />;
}

export { Badge, badgeVariants };