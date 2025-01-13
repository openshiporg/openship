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
    "disabled:hover:bg-inherit disabled:hover:from-inherit disabled:hover:to-inherit",
  ],
  {
    variants: {
      variant: {
        primary: [
          // "border-transparent",
          "border dark:border-zinc-600 border-zinc-800",
          "text-white dark:text-zinc-900",
          // "bg-zinc-900 dark:bg-zinc-50",
          "bg-gradient-to-b dark:from-white dark:to-zinc-100 from-gray-950 to-zinc-950",
          "hover:bg-zinc-800 dark:hover:bg-zinc-200",
          "disabled:opacity-50",
          // "disabled:bg-zinc-100 disabled:text-zinc-400",
          // "disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600",
        ],
        blue: [
          "relative border px-3 disabled:pointer-events-none disabled:shadow-none outline outline-offset-2 outline-0 focus-visible:outline-2 outline-blue-500 dark:outline-blue-500 border-transparent bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:bg-blue-300 disabled:text-white disabled:dark:bg-blue-800 disabled:dark:text-blue-400 group inline-flex w-full items-center justify-center whitespace-nowrap rounded-md border-none bg-gradient-to-b from-blue-500 to-blue-600 py-3 text-center text-sm font-medium text-white shadow-sm transition-all duration-100 ease-in-out hover:opacity-90 sm:w-fit dark:text-white",
        ],
        secondary: [
          "border border-zinc-300 dark:border-zinc-800",
          "text-zinc-900 dark:text-zinc-50",
          // "bg-white dark:bg-zinc-950",
          "bg-gradient-to-b from-white to-zinc-50 dark:from-gray-950 dark:to-zinc-950",
          "hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
          "disabled:opacity-50",
          "disabled:text-zinc-400",
          "disabled:dark:text-zinc-600",
        ],
        tertiary: [
          "text-white",
          "border-blue-600 dark:border-blue-800",
          "bg-gradient-to-b from-blue-400 to-blue-500 dark:from-blue-900 dark:to-blue-950",
          "hover:bg-blue-700 dark:hover:bg-blue-600",
          "disabled:opacity-50",
        ],
        light: [
          "shadow-none",
          "border-transparent",
          "text-zinc-900 dark:text-zinc-50",
          "bg-zinc-200 dark:bg-zinc-900",
          "hover:bg-zinc-300/70 dark:hover:bg-zinc-800/80",
          "disabled:bg-zinc-100 disabled:text-zinc-400",
          "disabled:dark:bg-zinc-800 disabled:dark:text-zinc-600",
        ],
        destructive: [
          "text-white",
          "border-transparent",
          // "bg-red-600 dark:bg-red-700",
          "bg-gradient-to-b from-red-500 to-red-600 dark:from-red-800 dark:to-red-900",
          "hover:bg-red-700 dark:hover:bg-red-600",
          "disabled:opacity-50",
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
  );
}

Button.displayName = "Button";

export { Button, buttonVariants, TouchTarget };
