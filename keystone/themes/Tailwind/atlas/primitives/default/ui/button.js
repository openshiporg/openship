import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { RiLoader2Fill } from "@remixicon/react";
import { cn } from "@keystone/utils/cn";
import { focusRing } from "./utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center rounded-md px-3 py-1.5 text-center text-sm font-medium shadow-sm transition-all duration-100 ease-in-out",
    "focus:ring-2 focus:ring-offset-1 focus:ring-offset-background",
  ],
  {
    variants: {
      variant: {
        primary: [
          "border-transparent",
          "text-white dark:text-gray-900",
          "bg-gray-900 dark:bg-gray-50",
          "hover:bg-gray-800 dark:hover:bg-gray-200",
          "disabled:bg-gray-100 disabled:text-gray-400",
          "disabled:dark:bg-gray-800 disabled:dark:text-gray-600",
        ],
        // primary: [
        //   "border-transparent",
        //   "text-white dark:text-blue-900",
        //   "bg-blue-900 dark:bg-blue-50",
        //   "hover:bg-blue-800 dark:hover:bg-blue-200",
        //   "disabled:bg-blue-100 disabled:text-blue-400",
        //   "disabled:dark:bg-blue-800 disabled:dark:text-blue-600"
        // ],
        secondary: [
          "border border-gray-300 dark:border-gray-800",
          "text-gray-900 dark:text-gray-50",
          // "bg-white dark:bg-gray-950",
          "bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-black",
          "hover:bg-gray-50 dark:hover:bg-gray-900/60",
          "disabled:text-gray-400",
          "disabled:dark:text-gray-600",
        ],
        light: [
          "shadow-none",
          "border-transparent",
          "text-gray-900 dark:text-gray-50",
          "bg-gray-200 dark:bg-gray-900",
          "hover:bg-gray-300/70 dark:hover:bg-gray-800/80",
          "disabled:bg-gray-100 disabled:text-gray-400",
          "disabled:dark:bg-gray-800 disabled:dark:text-gray-600",
        ],
        destructive: [
          "text-white",
          "border-transparent",
          "bg-red-600 dark:bg-red-700",
          "hover:bg-red-700 dark:hover:bg-red-600",
          "disabled:bg-red-300 disabled:text-white",
          "disabled:dark:bg-red-950 disabled:dark:text-red-400",
        ],
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      className,
      variant = "primary",
      asChild = false,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={forwardedRef}
        className={cn(buttonVariants({ variant }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
            <RiLoader2Fill
              className="size-4 shrink-0 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">
              {loadingText ? loadingText : "Loading"}
            </span>
            {loadingText ? loadingText : children}
          </span>
        ) : (
          children
        )}
      </Component>
    );
  }
);

function TouchTarget({ children }) {
  return (
    <>
      <span
        className="absolute left-1/2 top-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
      {children}
    </>
  )
}

Button.displayName = "Button";

export { Button, buttonVariants, TouchTarget };
