"use client"
import * as Popover from "@radix-ui/react-popover"
import * as React from "react"

import { cn } from "@keystone/utils/cn"

const shortcutStyles = cn(
  "hidden h-6 select-none items-center justify-center rounded-md bg-zinc-800 px-2 font-mono text-xs text-zinc-400 ring-1 ring-inset ring-zinc-700 transition sm:flex"
)

const CommandBar = ({
  open = false,
  onOpenChange,
  defaultOpen = false,
  disableAutoFocus = true,
  children
}) => {
  return (
    <Popover.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      <Popover.Anchor
        // className={cn("fixed inset-x-0 bottom-12 mx-auto w-fit items-center")}
      />
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={0}
          onOpenAutoFocus={e => {
            if (disableAutoFocus) {
              e.preventDefault()
            }
          }}
          className={cn(
            "z-50",
            "data-[state=closed]:animate-hide",
            "data-[side=top]:animate-slideUpAndFade"
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
CommandBar.displayName = "CommandBar"

const CommandBarValue = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "px-3 py-2.5 text-xs sm:text-sm tabular-nums text-zinc-300",
        className
      )}
      {...props}
    />
  )
})
CommandBarValue.displayName = "CommandBar.Value"

const CommandBarBar = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center rounded-lg bg-zinc-900 px-1 shadow-lg shadow-black/30 dark:ring-1 dark:ring-white/10",
        className
      )}
      {...props}
    />
  )
})
CommandBarBar.displayName = "CommandBarBar"

const CommandBarSeperator = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("h-4 w-px bg-zinc-700", className)}
      {...props}
    />
  )
})
CommandBarSeperator.displayName = "CommandBar.Seperator"

const CommandBarCommand = React.forwardRef(
  (
    { className, type = "button", label, action, shortcut, disabled, ...props },
    ref
  ) => {
    React.useEffect(() => {
      const handleKeyDown = event => {
        if (event.key === shortcut.shortcut) {
          event.preventDefault()
          event.stopPropagation()
          action()
        }
      }

      if (!disabled) {
        document.addEventListener("keydown", handleKeyDown)
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
      }
    }, [action, shortcut, disabled])

    return (
      <span
        className={cn(
          "flex items-center gap-x-2 rounded-lg bg-zinc-900 p-1 text-xs font-medium text-zinc-50 outline-none transition focus:z-10 sm:text-sm",
          "sm:last-of-type:-mr-1",
          className
        )}
      >
        <button
          ref={ref}
          type={type}
          onClick={action}
          disabled={disabled}
          className={cn(
            // base
            "flex items-center gap-x-2 rounded-md px-1 py-1 hover:bg-zinc-800", // focus
            "focus-visible:bg-zinc-800 focus-visible:hover:bg-zinc-800",
            "disabled:text-zinc-500",
          )}
          {...props}
        >
          <span>{label}</span>
          <span className={shortcutStyles}>
            {shortcut.label
              ? shortcut.label.toUpperCase()
              : shortcut.shortcut.toUpperCase()}
          </span>
        </button>
      </span>
    )
  }
)
CommandBarCommand.displayName = "CommandBar.Command"

export {
  CommandBar,
  CommandBarBar,
  CommandBarCommand,
  CommandBarSeperator,
  CommandBarValue
}
