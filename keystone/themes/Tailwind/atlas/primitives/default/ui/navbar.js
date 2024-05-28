'use client'

import * as Headless from '@headlessui/react'
import { LayoutGroup, motion } from 'framer-motion'
import React, { useId } from 'react'
import { TouchTarget } from './button'
import { Link } from './link'
import { cn } from '@keystone/utils/cn'

export function Navbar({ className, ...props }) {
  return <nav {...props} className={cn(className, 'flex flex-1 items-center gap-4 py-2.5')} />
}

export function NavbarDivider({ className, ...props }) {
  return <div aria-hidden="true" {...props} className={cn(className, 'h-6 w-px bg-zinc-950/10 dark:bg-white/10')} />
}

export function NavbarSection({ className, ...props }) {
  let id = useId()

  return (
    <LayoutGroup id={id}>
      <div {...props} className={cn(className, 'flex items-center gap-3')} />
    </LayoutGroup>
  )
}

export function NavbarSpacer({ className, ...props }) {
  return <div aria-hidden="true" {...props} className={cn(className, '-ml-4 flex-1')} />
}

export const NavbarItem = React.forwardRef(function NavbarItem(
  { current, className, children, ...props },

  ref
) {
  let classes = cn(
    // Base
    'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5',
    // Leading icon/icon-only
    'data-[slot=icon]:*:size-6 data-[slot=icon]:*:shrink-0 data-[slot=icon]:*:fill-zinc-500 sm:data-[slot=icon]:*:size-5',
    // Trailing icon (down chevron or similar)
    'data-[slot=icon]:last:[&:not(:nth-child(2))]:*:ml-auto data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-5 sm:data-[slot=icon]:last:[&:not(:nth-child(2))]:*:size-4',
    // Avatar
    'data-[slot=avatar]:*:-m-0.5 data-[slot=avatar]:*:size-7 data-[slot=avatar]:*:[--avatar-radius:theme(borderRadius.DEFAULT)] data-[slot=avatar]:*:[--ring-opacity:10%] sm:data-[slot=avatar]:*:size-6',
    // Hover
    'data-[hover]:bg-zinc-950/5 data-[slot=icon]:*:data-[hover]:fill-zinc-950',
    // Active
    'data-[active]:bg-zinc-950/5 data-[slot=icon]:*:data-[active]:fill-zinc-950',
    // Dark mode
    'dark:text-white dark:data-[slot=icon]:*:fill-zinc-400',
    'dark:data-[hover]:bg-white/5 dark:data-[slot=icon]:*:data-[hover]:fill-white',
    'dark:data-[active]:bg-white/5 dark:data-[slot=icon]:*:data-[active]:fill-white'
  )

  return (
    <span className={cn(className, 'relative')}>
      {current && (
        <motion.span
          layoutId="current-indicator"
          className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
        />
      )}
      {'href' in props ? (
        <Link {...props} className={classes} data-current={current ? 'true' : undefined} ref={ref}>
          <TouchTarget>{children}</TouchTarget>
        </Link>
      ) : (
        <Headless.Button
          {...props}
          className={cn('cursor-default', classes)}
          data-current={current ? 'true' : undefined}
          ref={ref}
        >
          <TouchTarget>{children}</TouchTarget>
        </Headless.Button>
      )}
    </span>
  )
})

export function NavbarLabel({ className, ...props }) {
  return <span {...props} className={cn(className, 'truncate')} />
}