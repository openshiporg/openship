

'use client'

import * as Headless from '@headlessui/react'

import { Button } from './button'
import { Link } from './link'
import { cn } from '@keystone/utils/cn'

export function Dropdown(props) {
  return <Headless.Menu {...props} />
}

export function DropdownButton({ as = Button, ...props }) {
  return <Headless.MenuButton as={as} {...props} />
}

export function DropdownMenu({ anchor = 'bottom', className, ...props }) {
  return (
    <Headless.Transition leave="duration-100 ease-in" leaveTo="opacity-0">
      <Headless.MenuItems
        {...props}
        anchor={anchor}
        className={cn(
          className,
          // Anchor positioning
          '[--anchor-gap:theme(spacing.2)] [--anchor-padding:theme(spacing.1)] data-[anchor~=end]:[--anchor-offset:6px] data-[anchor~=start]:[--anchor-offset:-6px] sm:data-[anchor~=end]:[--anchor-offset:4px] sm:data-[anchor~=start]:[--anchor-offset:-4px]',
          // Base styles
          'isolate w-max rounded-lg p-1',
          // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
          'outline outline-1 outline-transparent focus:outline-none',
          // Handle scrolling when menu won't fit in viewport
          'overflow-y-auto',
          // Popover background
          'bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75',
          // Shadows
          'shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10',
          // Define grid at the menu level if subgrid is supported
          'supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]'
        )}
      />
    </Headless.Transition>
  )
}

export function DropdownItem({ className, ...props }) {
  let classes = cn(
    className,
    // Base styles
    'group cursor-default rounded-md px-3.5 py-2.5 focus:outline-none sm:px-3 sm:py-1.5',
    // Text styles
    'text-left text-base/6 text-zinc-700 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]',
    // Focus
    'data-[focus]:bg-blue-500 data-[focus]:text-white',
    // Disabled state
    'data-[disabled]:opacity-50',
    // Forced colors mode
    'forced-color-adjust-none forced-colors:data-[focus]:bg-[Highlight] forced-colors:data-[focus]:text-[HighlightText] forced-colors:[&>[data-slot=icon]]:data-[focus]:text-[HighlightText]',
    // Use subgrid when available but fallback to an explicit grid layout if not
    'col-span-full grid grid-cols-[auto_1fr_1.5rem_0.5rem_auto] items-center supports-[grid-template-columns:subgrid]:grid-cols-subgrid',
    // Icons
    '[&>[data-slot=icon]]:col-start-1 [&>[data-slot=icon]]:row-start-1 [&>[data-slot=icon]]:-ml-0.5 [&>[data-slot=icon]]:mr-2.5 [&>[data-slot=icon]]:size-5 sm:[&>[data-slot=icon]]:mr-2 [&>[data-slot=icon]]:sm:size-4',
    '[&>[data-slot=icon]]:text-zinc-500 [&>[data-slot=icon]]:data-[focus]:text-white [&>[data-slot=icon]]:dark:text-zinc-400 [&>[data-slot=icon]]:data-[focus]:dark:text-white',
    // Avatar
    '[&>[data-slot=avatar]]:-ml-1 [&>[data-slot=avatar]]:mr-2.5 [&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:mr-2 sm:[&>[data-slot=avatar]]:size-5'
  )

  return 'href' in props ? (
    <Headless.MenuItem as={Link} {...props} className={classes} />
  ) : (
    <Headless.MenuItem as="button" type="button" {...props} className={classes} />
  )
}

export function DropdownHeader({ className, ...props }) {
  return <div {...props} className={cn(className, 'col-span-5 px-3.5 pb-1 pt-2.5 sm:px-3')} />
}

export function DropdownSection({ className, ...props }) {
  return (
    <Headless.MenuSection
      {...props}
      className={cn(
        className,
        // Define grid at the section level instead of the item level if subgrid is supported
        'col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]'
      )}
    />
  )
}

export function DropdownHeading({ className, ...props }) {
  return (
    <Headless.MenuHeading
      {...props}
      className={cn(
        className,
        'col-span-full grid grid-cols-[1fr,auto] gap-x-12 px-3.5 pb-1 pt-2 text-sm/5 font-medium text-zinc-500 sm:px-3 sm:text-xs/5 dark:text-zinc-400'
      )}
    />
  )
}

export function DropdownDivider({ className, ...props }) {
  return (
    <Headless.MenuSeparator
      {...props}
      className={cn(
        className,
        'col-span-full mx-3.5 my-1 h-px border-0 bg-zinc-950/5 sm:mx-3 dark:bg-white/10 forced-colors:bg-[CanvasText]'
      )}
    />
  )
}

export function DropdownLabel({ className, ...props }) {
  return (
    <Headless.Label {...props} data-slot="label" className={cn(className, 'col-start-2 row-start-1')} {...props} />
  )
}

export function DropdownDescription({ className, ...props }) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={cn(
        className,
        'col-span-2 col-start-2 row-start-2 text-sm/5 text-zinc-500 group-data-[focus]:text-white sm:text-xs/5 dark:text-zinc-400 forced-colors:group-data-[focus]:text-[HighlightText]'
      )}
    />
  )
}

export function DropdownShortcut({ keys, className, ...props }) {
  return (
    <Headless.Description
      as="kbd"
      {...props}
      className={cn(className, 'col-start-5 row-start-1 flex justify-self-end')}
    >
      {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
        <kbd
          key={index}
          className={cn([
            'min-w-[2ch] text-center font-sans capitalize text-zinc-400 group-data-[focus]:text-white forced-colors:group-data-[focus]:text-[HighlightText]',
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && 'pl-1',
          ])}
        >
          {char}
        </kbd>
      ))}
    </Headless.Description>
  )
}