"use client"

import * as DrawerPrimitives from "@radix-ui/react-dialog"
import { RiCloseLine } from "@remixicon/react"
import * as React from "react"

import { cn } from "@/lib/utils"

import { Button } from "./button"

const Drawer = (
  props: React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Root>,
) => {
  return <DrawerPrimitives.Root tremor-id="tremor-raw" {...props} />
}
Drawer.displayName = "Drawer"

const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Trigger>
>(({ className, ...props }, ref) => {
  return (
    <DrawerPrimitives.Trigger ref={ref} className={cn(className)} {...props} />
  )
})
DrawerTrigger.displayName = "Drawer.Trigger"

const DrawerClose = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Close>
>(({ className, ...props }, ref) => {
  return (
    <DrawerPrimitives.Close ref={ref} className={cn(className)} {...props} />
  )
})
DrawerClose.displayName = "Drawer.Close"

const DrawerPortal = DrawerPrimitives.Portal

DrawerPortal.displayName = "DrawerPortal"

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Overlay>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPrimitives.Overlay
      ref={forwardedRef}
      className={cn(
        // base
        "fixed inset-0 z-50 overflow-y-auto",
        // background color
        "bg-black/30 dark:bg-black/60",
        // transition
        "data-[state=closed]:animate-hide data-[state=open]:animate-dialogOverlayShow",
        className,
      )}
      {...props}
      style={{
        animationDuration: "400ms",
        animationFillMode: "backwards",
      }}
    />
  )
})

DrawerOverlay.displayName = "DrawerOverlay"

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Content>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPortal>
      <DrawerOverlay>
        <DrawerPrimitives.Content
          ref={forwardedRef}
          className={cn(
            // base
            "fixed inset-y-2 mx-auto flex w-[95vw] flex-1 flex-col rounded-md border shadow-lg focus:outline-none overflow-hidden max-sm:inset-x-2 sm:inset-y-2 sm:right-2 sm:max-w-lg",
            // border color
            "border",
            // background color
            "bg-white dark:bg-background",
            // transition
            "data-[state=closed]:animate-drawerSlideRightAndFade data-[state=open]:animate-drawerSlideLeftAndFade",
            className,
          )}
          {...props}
        />
      </DrawerOverlay>
    </DrawerPortal>
  )
})

DrawerContent.displayName = "DrawerContent"

const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className="flex items-start justify-between gap-x-4 border-b border-zinc-200 p-6 dark:border-zinc-900"
      {...props}
    >
      <div className={cn("mt-1 flex flex-col gap-y-1", className)}>
        {children}
      </div>
      <DrawerPrimitives.Close asChild>
        <Button
          variant="ghost"
          className="aspect-square p-1 text-zinc-500 hover:bg-zinc-100 hover:dark:bg-zinc-400/10"
        >
          <RiCloseLine className="size-6" aria-hidden="true" />
        </Button>
      </DrawerPrimitives.Close>
    </div>
  )
})

DrawerHeader.displayName = "Drawer.Header"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <DrawerPrimitives.Title
    ref={forwardedRef}
    className={cn(
      // base
      "text-base font-semibold",
      // text color
      "text-zinc-900 dark:text-zinc-50",
      className,
    )}
    {...props}
  />
))

DrawerTitle.displayName = "DrawerTitle"

const DrawerBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn(
        "flex-1 overflow-y-auto px-6",
        className
      )} 
      {...props} 
    />
  )
})

DrawerBody.displayName = "Drawer.Body"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitives.Description>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DrawerPrimitives.Description
      ref={forwardedRef}
      className={cn("text-zinc-500 dark:text-zinc-500", className)}
      {...props}
    />
  )
})

DrawerDescription.displayName = "DrawerDescription"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "mt-auto border-t p-6",
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  )
}

DrawerFooter.displayName = "DrawerFooter"

export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
}
