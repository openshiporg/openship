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
        default: "h-8 px-3 py-1 text-sm md:h-10 md:px-4 md:py-2 md:text-base", // Adjusted default size
        xs: "h-5 px-1 text-xs md:h-7 md:px-2 md:text-sm", // Extra small size
        sm: "h-6 px-2 text-sm md:h-9 md:px-3 md:text-base", // Small size
        lg: "h-9 px-5 text-lg md:h-11 md:px-8 md:text-xl", // Large size
        icon: "h-8 w-8 md:h-10 md:w-10", // Icon size
      },
      color: {
        slate:
          "bg-slate-500 text-white hover:bg-slate-600 dark:bg-slate-500/10 dark:text-slate-600 dark:hover:bg-slate-500/20",
        gray: "bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-500/10 dark:text-gray-600 dark:hover:bg-gray-500/20",
        zinc: "bg-zinc-500 text-white hover:bg-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-600 dark:hover:bg-zinc-500/20",
        neutral:
          "bg-neutral-500 text-white hover:bg-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-600 dark:hover:bg-neutral-500/20",
        stone:
          "bg-stone-500 text-white hover:bg-stone-600 dark:bg-stone-500/10 dark:text-stone-600 dark:hover:bg-stone-500/20",
        red: "bg-red-500 text-white hover:bg-red-600 dark:bg-red-500/10 dark:text-red-600 dark:hover:bg-red-500/20",
        orange:
          "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-500/10 dark:text-orange-600 dark:hover:bg-orange-500/20",
        amber:
          "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500/10 dark:text-amber-600 dark:hover:bg-amber-500/20",
        yellow:
          "bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-600 dark:hover:bg-yellow-500/20",
        lime: "bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-500/10 dark:text-lime-600 dark:hover:bg-lime-500/20",
        green:
          "bg-green-500 text-white hover:bg-green-600 dark:bg-green-500/10 dark:text-green-600 dark:hover:bg-green-500/20",
        emerald:
          "bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-600 dark:hover:bg-emerald-500/20",
        teal: "bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-500/10 dark:text-teal-600 dark:hover:bg-teal-500/20",
        cyan: "bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-600 dark:hover:bg-cyan-500/20",
        sky: "bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-500/10 dark:text-sky-600 dark:hover:bg-sky-500/20",
        blue: "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500/10 dark:text-blue-600 dark:hover:bg-blue-500/20",
        indigo:
          "bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-600 dark:hover:bg-indigo-500/20",
        violet:
          "bg-violet-500 text-white hover:bg-violet-600 dark:bg-violet-500/10 dark:text-violet-600 dark:hover:bg-violet-500/20",
        purple:
          "bg-purple-500 text-white hover:bg-purple-600 dark:bg-purple-500/10 dark:text-purple-600 dark:hover:bg-purple-500/20",
        fuchsia:
          "bg-fuchsia-500 text-white hover:bg-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-600 dark:hover:bg-fuchsia-500/20",
        pink: "bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-500/10 dark:text-pink-600 dark:hover:bg-pink-500/20",
        rose: "bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-500/10 dark:text-rose-600 dark:hover:bg-rose-500/20",
        black:
          "bg-black-500 text-white hover:bg-black-600 dark:bg-black-500/10 dark:text-black-600 dark:hover:bg-black-500/20",
        white:
          "bg-white-500 text-white hover:bg-white-600 dark:bg-white-500/10 dark:text-white-600 dark:hover:bg-white-500/20",
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
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
