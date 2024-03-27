import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@keystone/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // size: {
      //   default: "h-10 px-4 py-2",
      //   xs: "h-7 rounded-md px-2 text-xs",
      //   sm: "h-9 rounded-md px-3",
      //   lg: "h-11 rounded-md px-8",
      //   icon: "h-10 w-10",
      // },
      size: {
        default: "px-3 py-1 text-sm md:px-4 md:py-2 md:text-base", // Adjusted default size
        xs: "px-1 py-1 text-xs md:px-2 md:text-sm", // Extra small size
        sm: "px-2 py-1 text-sm md:px-3 md:text-base", // Small size
        lg: "px-5 py-1 text-lg md:px-8 md:text-xl", // Large size
        icon: "h-8 w-8 md:h-10 md:w-10", // Icon size
      },
      color: {
        slate:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-900 dark:hover:text-slate-300",
        gray: "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300",
        zinc: "bg-zinc-100 text-zinc-700 hover:bg-zinc-300 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-300",
        neutral:
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:hover:text-neutral-300",
        stone:
          "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-800 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-900 dark:hover:text-stone-300",
        red: "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-600 dark:hover:bg-red-500/20",
        orange:
          "bg-orange-50 text-orange-500 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-600 dark:hover:bg-orange-500/20",
        amber:
          "bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-600 dark:hover:bg-amber-500/20",
        yellow:
          "bg-yellow-50 text-yellow-500 hover:bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-600 dark:hover:bg-yellow-500/20",
        lime: "bg-lime-50 text-lime-500 hover:bg-lime-100 dark:bg-lime-500/10 dark:text-lime-600 dark:hover:bg-lime-500/20",
        green:
          "bg-green-50 text-green-500 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-600 dark:hover:bg-green-500/20",
        emerald:
          "bg-emerald-50 text-emerald-500 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-600 dark:hover:bg-emerald-500/20",
        teal: "bg-teal-50 text-teal-500 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-600 dark:hover:bg-teal-500/20",
        cyan: "bg-cyan-50 text-cyan-500 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-600 dark:hover:bg-cyan-500/20",
        sky: "bg-sky-50 text-sky-500 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-600 dark:hover:bg-sky-500/20",
        blue: "bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-600 dark:hover:bg-blue-500/20",
        indigo:
          "bg-indigo-50 text-indigo-500 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-600 dark:hover:bg-indigo-500/20",
        violet:
          "bg-violet-50 text-violet-500 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-600 dark:hover:bg-violet-500/20",
        purple:
          "bg-purple-50 text-purple-500 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-600 dark:hover:bg-purple-500/20",
        fuchsia:
          "bg-fuchsia-50 text-fuchsia-500 hover:bg-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-600 dark:hover:bg-fuchsia-500/20",
        pink: "bg-pink-50 text-pink-500 hover:bg-pink-100 dark:bg-pink-500/10 dark:text-pink-600 dark:hover:bg-pink-500/20",
        rose: "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-600 dark:hover:bg-rose-500/20",
        black:
          "bg-black-50 text-black-500 hover:bg-black-100 dark:bg-black-500/10 dark:text-black-600 dark:hover:bg-black-500/20",
        white:
          "bg-white-50 text-white-500 hover:bg-white-100 dark:bg-white-500/10 dark:text-white-600 dark:hover:bg-white-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      isDisabled,
      isLoading,
      className,
      variant,
      size,
      color,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    // This will compute the correct class names based on the props
    const buttonClassName = cn(
      buttonVariants({ variant, size, color }),
      className
    );

    return (
      <Comp
        className={buttonClassName}
        ref={ref}
        disabled={isDisabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
