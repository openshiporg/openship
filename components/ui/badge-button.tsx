"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";

const badgeVariants = cva(
  "leading-tight px-2 py-1 group relative inline-flex rounded-md focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500",
  {
    variants: {
      color: {
        white: "bg-white text-black border-muted-foreground/20 dark:border-muted-foreground/10",
        red: "bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-900/50",
        orange:
          "bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
        amber:
          "bg-amber-400/20 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
        yellow:
          "bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/50",
        lime: "bg-lime-400/20 text-lime-700 dark:bg-lime-400/10 dark:text-lime-300 border-lime-200 dark:border-lime-900/50",
        green:
          "bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-300 dark:border-green-900/50",
        emerald:
          "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
        teal: "bg-teal-500/15 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 border-teal-200 dark:border-teal-900/50",
        cyan: "bg-cyan-400/20 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/50",
        sky: "bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200 dark:border-sky-900/50",
        blue: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
        indigo:
          "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
        violet:
          "bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-900/50",
        purple:
          "bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
        fuchsia:
          "bg-fuchsia-400/15 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-900/50",
        pink: "bg-pink-400/15 text-pink-700 dark:bg-pink-400/10 dark:text-pink-400 border-pink-200 dark:border-pink-900/50",
        rose: "bg-rose-400/15 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
        zinc: "bg-zinc-500/10 text-zinc-500/90 dark:bg-white/5 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700/50",
      },
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

type BadgeColorType = NonNullable<VariantProps<typeof badgeVariants>["color"]>;

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  color?: BadgeColorType;
};

function Badge({ className, color, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ color }), className)} {...props} />;
}

type BadgeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  color?: BadgeColorType;
  isLoading?: boolean;
  loadingText?: string;
  isDisabled?: boolean;
  href?: string;
};

// Simple TouchTarget component since we don't have access to the original
const TouchTarget = ({ children }: { children: React.ReactNode }) => {
  return <span className="absolute inset-0 rounded-md">{children}</span>;
};

const BadgeButton = React.forwardRef<HTMLButtonElement, BadgeButtonProps>(function BadgeButton(
  { color, className, isLoading, loadingText, children, isDisabled, href, ...props },
  ref
) {
  const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return href ? (
    <Link
      href={href}
      className={`group relative inline-flex rounded-md focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500 ${disabledClass}`}
    >
      <TouchTarget>
        <Badge color={color}>{children}</Badge>
      </TouchTarget>
    </Link>
  ) : (
    <button
      {...props}
      className={`group relative inline-flex rounded-md focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500 ${disabledClass}`}
      ref={ref}
      disabled={isDisabled}
    >
      <TouchTarget>
        <Badge color={color} className={className}>
          {isLoading ? (
            <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
              <svg 
                className="size-4 shrink-0 animate-spin"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="sr-only">
                {loadingText ? loadingText : "Loading"}
              </span>
              {loadingText ? loadingText : children}
            </span>
          ) : (
            children
          )}
        </Badge>
      </TouchTarget>
    </button>
  );
});

export { Badge, BadgeButton, badgeVariants }; 