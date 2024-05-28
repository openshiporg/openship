import { clsx } from "clsx";
import React from "react";
import { cva } from "class-variance-authority";
import { Button as HeadlessButton } from "@headlessui/react";
import { Loader2 } from "lucide-react";

const colorStyles = {
  "dark/slate": [
    "text-white bg-slate-900 border-slate-950/90 hover:bg-slate-950 hover:border-slate-950/90 active:bg-slate-900 active:border-slate-950/90",
    "dark:text-white dark:bg-slate-800 dark:hover:bg-slate-900 dark:hover:border-slate-900",
    "icon-color:slate-400 dark:icon-color:slate-500 icon-color:hover:slate-300 dark:icon-color:hover:slate-400",
  ],
  light: [
    "text-slate-600 bg-white border-slate-950/10 hover:bg-gray-100 hover:border-slate-950/15 active:bg-gray-200 active:border-slate-950/20",
    "dark:text-white dark:bg-slate-800 dark:hover:bg-slate-700",
    "icon-color:slate-500 dark:icon-color:slate-400 icon-color:hover:slate-700 dark:icon-color:hover:slate-500",
  ],
  "dark/white": [
    "text-white bg-slate-900 border-slate-950/90 hover:bg-slate-900 hover:border-slate-950/90 active:bg-slate-900 active:border-slate-950/90",
    "dark:text-white dark:bg-white dark:hover:bg-slate-950/2.5 dark:hover:border-slate-950/2.5",
    "icon-color:slate-400 dark:icon-color:slate-500 icon-color:hover:slate-300 dark:icon-color:hover:slate-400",
  ],
  dark: [
    "text-white bg-slate-900 border-slate-950/90 hover:bg-slate-900 hover:border-slate-950/90 active:bg-slate-900 active:border-slate-950/90",
    "dark:text-white dark:bg-slate-900/20 dark:shadow-sm dark:border-slate-900/50 hover:dark:bg-slate-900/10 active:dark:bg-slate-800/40",
    "icon-color:slate-400 icon-color:hover:slate-300 active:icon-color:slate-300",
  ],
  white: [
    "text-slate-950 bg-white border-slate-950/10 hover:bg-gray-100 hover:border-slate-950/15 active:bg-gray-200 active:border-slate-950/20",
    "dark:text-white dark:bg-white/20 dark:shadow-sm dark:border-white/50 hover:dark:bg-white/10 active:dark:bg-white/40",
    "icon-color:slate-400 icon-color:hover:slate-500",
  ],
  slate: [
    "text-white bg-slate-600 border-slate-700/90 hover:bg-slate-700 hover:border-slate-700/90 active:bg-slate-600 active:border-slate-700/90",
    "dark:text-white dark:bg-slate-600/20 dark:shadow-sm dark:border-slate-600/50 hover:dark:bg-slate-600/10 active:dark:bg-slate-500/40",
    "icon-color:slate-400 icon-color:hover:slate-300",
  ],
  indigo: [
    "text-white bg-indigo-500 border-indigo-600/90 hover:bg-indigo-600 hover:border-indigo-600/90 active:bg-indigo-500 active:border-indigo-600/90",
    "dark:text-white dark:bg-indigo-900/50 dark:shadow-sm dark:border-indigo-900/10 dark:hover:border-indigo-900/10 hover:dark:bg-indigo-900/40 active:dark:bg-indigo-800/40",
    "icon-color:indigo-300 icon-color:hover:indigo-200 active:icon-color:indigo-200",
  ],
  cyan: [
    "text-cyan-950 bg-cyan-300 border-cyan-400/80 hover:bg-cyan-500 hover:border-cyan-400/80 active:bg-cyan-300 active:border-cyan-400/80",
    "dark:text-white dark:bg-cyan-900/20 dark:shadow-sm dark:border-cyan-900/50 hover:dark:bg-cyan-900/10 active:dark:bg-cyan-800/40",
    "icon-color:cyan-500",
  ],
  red: [
    "text-white bg-red-600 border-red-700/90 hover:bg-red-700 hover:border-red-700/90 active:bg-red-600 active:border-red-700/90",
    "dark:text-white dark:bg-red-900/50 dark:shadow-sm dark:border-red-900/10 dark:hover:border-red-900/10 hover:dark:bg-red-900/40 active:dark:bg-red-800/40",
    "icon-color:red-300 icon-color:hover:red-200 active:icon-color:red-200",
  ],
  orange: [
    "text-white bg-orange-500 border-orange-600/90 hover:bg-orange-400 hover:border-orange-600/90 active:bg-orange-500 active:border-orange-600/90",
    "dark:text-white dark:bg-orange-900/20 dark:shadow-sm dark:border-orange-900/50 hover:dark:bg-orange-900/10 active:dark:bg-orange-800/40",
    "icon-color:orange-300 icon-color:hover:orange-200 active:icon-color:orange-200",
  ],
  amber: [
    "text-amber-950 bg-amber-600 border-amber-500/80 hover:bg-amber-700 hover:border-amber-500/80 active:bg-amber-400 active:border-amber-500/80",
    "dark:text-white dark:bg-amber-900/20 dark:shadow-sm dark:border-amber-900/50 hover:dark:bg-amber-900/10 active:dark:bg-amber-800/40",
    "icon-color:amber-600",
  ],
  yellow: [
    "text-yellow-950 bg-yellow-600 border-yellow-400/80 hover:bg-yellow-700 hover:border-yellow-400/80 active:bg-yellow-300 active:border-yellow-400/80",
    "dark:text-white dark:bg-yellow-900/20 dark:shadow-sm dark:border-yellow-900/50 hover:dark:bg-yellow-900/10 active:dark:bg-yellow-800/40",
    "icon-color:yellow-600 icon-color:hover:yellow-700 active:icon-color:yellow-700",
  ],
  lime: [
    "text-lime-950 bg-lime-600 border-lime-400/80 hover:bg-lime-700 hover:border-lime-400/80 active:bg-lime-300 active:border-lime-400/80",
    "dark:text-white dark:bg-lime-900/20 dark:shadow-sm dark:border-lime-900/50 hover:dark:bg-lime-900/10 active:dark:bg-lime-800/40",
    "icon-color:lime-600 icon-color:hover:lime-700 active:icon-color:lime-700",
  ],
  green: [
    "text-white bg-green-600 border-green-700/90 hover:bg-green-700 hover:border-green-700/90 active:bg-green-600 active:border-green-700/90",
    "dark:text-white dark:bg-green-900/50 dark:shadow-sm dark:border-green-900/10 dark:hover:border-green-900/10 hover:dark:bg-green-900/40 active:dark:bg-green-800/40",
    "icon-color:white/60 icon-color:hover:white/80 active:icon-color:white/80",
  ],
  emerald: [
    "text-white bg-emerald-600 border-emerald-700/90 hover:bg-emerald-700 hover:border-emerald-700/90 active:bg-emerald-600 active:border-emerald-700/90",
    "dark:text-white dark:bg-emerald-900/50 dark:shadow-sm dark:border-emerald-900/10 dark:hover:border-emerald-900/10 hover:dark:bg-emerald-900/40 active:dark:bg-emerald-800/40",
    "icon-color:white/60 icon-color:hover:white/80 active:icon-color:white/80",
  ],
  teal: [
    "text-white bg-teal-600 border-teal-700/90 hover:bg-teal-700 hover:border-teal-700/90 active:bg-teal-600 active:border-teal-700/90",
    "dark:text-white dark:bg-teal-900/20 dark:shadow-sm dark:border-teal-900/50 hover:dark:bg-teal-900/10 active:dark:bg-teal-800/40",
    "icon-color:white/60 icon-color:hover:white/80 active:icon-color:white/80",
  ],
  sky: [
    "text-white bg-sky-600 border-sky-700/90 hover:bg-sky-700 hover:border-sky-700/90 active:bg-sky-600 active:border-sky-700/90",
    "dark:text-white dark:bg-sky-900/50 dark:shadow-sm dark:border-sky-900/10 dark:hover:border-sky-900/10 hover:dark:bg-sky-900/40 active:dark:bg-sky-800/40",
    "icon-color:white/60 icon-color:hover:white/80 active:icon-color:white/80",
  ],
  blue: [
    "text-white bg-blue-600 border-blue-700/90 hover:bg-blue-700 hover:border-blue-700/90 active:bg-blue-600 active:border-blue-700/90",
    "dark:text-white dark:bg-blue-900/50 dark:shadow-sm dark:border-blue-900/10 dark:hover:border-blue-900/10 hover:dark:bg-blue-900/40 active:dark:bg-blue-800/40",
    "icon-color:blue-400 icon-color:hover:blue-300 active:icon-color:blue-300",
  ],
  violet: [
    "text-white bg-violet-500 border-violet-600/90 hover:bg-violet-700 hover:border-violet-600/90 active:bg-violet-500 active:border-violet-600/90",
    "dark:text-white dark:bg-violet-900/20 dark:shadow-sm dark:border-violet-900/50 hover:dark:bg-violet-900/10 active:dark:bg-violet-800/40",
    "icon-color:violet-300 icon-color:hover:violet-200 active:icon-color:violet-200",
  ],
  purple: [
    "text-white bg-purple-500 border-purple-600/90 hover:bg-purple-700 hover:border-purple-600/90 active:bg-purple-500 active:border-purple-600/90",
    "dark:text-white dark:bg-purple-900/20 dark:shadow-sm dark:border-purple-900/50 hover:dark:bg-purple-900/10 active:dark:bg-purple-800/40",
    "icon-color:purple-300 icon-color:hover:purple-200 active:icon-color:purple-200",
  ],
  fuchsia: [
    "text-white bg-fuchsia-500 border-fuchsia-600/90 hover:bg-fuchsia-700 hover:border-fuchsia-600/90 active:bg-fuchsia-500 active:border-fuchsia-600/90",
    "dark:text-white dark:bg-fuchsia-900/20 dark:shadow-sm dark:border-fuchsia-900/50 hover:dark:bg-fuchsia-900/10 active:dark:bg-fuchsia-800/40",
    "icon-color:fuchsia-300 icon-color:hover:fuchsia-200 active:icon-color:fuchsia-200",
  ],
  pink: [
    "text-white bg-pink-500 border-pink-600/90 hover:bg-pink-700 hover:border-pink-600/90 active:bg-pink-500 active:border-pink-600/90",
    "dark:text-white dark:bg-pink-900/20 dark:shadow-sm dark:border-pink-900/50 hover:dark:bg-pink-900/10 active:dark:bg-pink-800/40",
    "icon-color:pink-300 icon-color:hover:pink-200 active:icon-color:pink-200",
  ],
  rose: [
    "text-white bg-rose-500 border-rose-600/90 hover:bg-rose-700 hover:border-rose-600/90 active:bg-rose-500 active:border-rose-600/90",
    "dark:text-white dark:bg-rose-900/20 dark:shadow-sm dark:border-rose-900/50 hover:dark:bg-rose-900/10 active:dark:bg-rose-800/40",
    "icon-color:rose-300 icon-color:hover:rose-200 active:icon-color:rose-20",
  ],
};

export const buttonVariants = cva(
  clsx(
    "relative isolate inline-flex items-center justify-center gap-x-2 rounded-md border text-base/6 font-semibold",
    // "px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6",
    // "ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
    "disabled:opacity-50",
    "[&>[data-slot=icon]]:-mx-0.5 [&>[data-slot=icon]]:my-0.5 [&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-[theme(colors.slate.500)] [&>[data-slot=icon]]:sm:my-1 [&>[data-slot=icon]]:sm:size-4 forced-colors:[--btn-icon:ButtonText] forced-colors:focus:[--btn-icon:ButtonText]"
  ),
  {
    variants: {
      variant: {
        solid: [
          // "border-transparent",
          "before:absolute before:inset-0 before:-z-10 before:rounded-[calc(theme(borderRadius.md)-1px)]",
          "before:shadow",
          "after:absolute after:inset-0 after:-z-10 after:rounded-[calc(theme(borderRadius.md)-1px)]",
          "after:shadow-[shadow:inset_0_2px_theme(colors.white/15%)]",
          "dark:after:shadow-[shadow:inset_0_2px_theme(colors.black/30%)]",
          "before:disabled:shadow-none after:disabled:shadow-none",
        ],
        outline: [
          "shadow-sm border-slate-950/10 text-slate-950",
          "dark:border-white/15 dark:text-white",
          "text-[theme(colors.slate.500)]",
        ],
        plain: [
          "bg-transparent dark:bg-transparent border-0 text-slate-950",
          "focus:bg-slate-950/5 dark:text-white",
          "text-[theme(colors.slate.500)]",
        ],
      },
      size: {
        default: "px-3 py-2 text-sm md:px-4 md:text-base", // Adjusted default size
        xs: "px-2 py-1 text-xs md:px-3 md:text-sm", // Extra small size
        sm: "h-9 px-2 py-1 text-xs md:px-3 md:text-sm", // Small size
        lg: "px-5 py-2 text-lg md:px-8 md:text-xl", // Large size
        icon: "h-8 w-8", // Icon size
      },
      color: Object.fromEntries(
        Object.entries(colorStyles).map(([key, value]) => [key, value])
      ),
    },
    defaultVariants: {
      variant: "solid",
      color: "light",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(function Button(
  {
    variant,
    size,
    color,
    outline,
    plain,
    className,
    isDisabled,
    isLoading,
    children,
    ...props
  },
  ref
) {
  const classes = clsx(
    buttonVariants({ variant, size, color, outline, plain }),
    className
  );

  return "href" in props ? (
    <Link {...props} className={classes} ref={ref}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <button
      {...props}
      className={classes}
      ref={ref}
      disabled={isDisabled || isLoading}
    >
      <TouchTarget>
        {isLoading && (
          <Loader2
            strokeWidth={3}
            className="mr-2 h-3 w-3 md:h-5 md:w-5 animate-spin"
          />
        )}
        {children}
      </TouchTarget>
    </button>
  );
});

/* Expand the hit area to at least 44×44px on touch devices */
export function TouchTarget({ children }) {
  return (
    <>
      {children}
      <span
        className="absolute left-1/2 top-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
    </>
  );
}
