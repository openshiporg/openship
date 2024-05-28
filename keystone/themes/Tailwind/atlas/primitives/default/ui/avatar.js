import * as Headless from '@headlessui/react'
import React from 'react'
import { TouchTarget } from './button'
import { Link } from './link'
import { cn } from '@keystone/utils/cn'

export function Avatar({ src = null, square = false, initials, alt = '', className, ...props }) {
  return (
    <span
      data-slot="avatar"
      {...props}
      className={cn(
        className,
        // Basic layout
        'inline-grid shrink-0 align-middle [--avatar-radius:20%] [--ring-opacity:20%] *:col-start-1 *:row-start-1',
        'outline outline-1 -outline-offset-1 outline-black/[--ring-opacity] dark:outline-white/[--ring-opacity]',
        // Add the correct border radius
        square ? 'rounded-[--avatar-radius] *:rounded-[--avatar-radius]' : 'rounded-full *:rounded-full'
      )}
    >
      {initials && (
        <svg
          className="select-none fill-current text-[48px] font-medium uppercase"
          viewBox="0 0 100 100"
          aria-hidden={alt ? undefined : 'true'}
        >
          {alt && <title>{alt}</title>}
          <text x="50%" y="50%" alignmentBaseline="middle" dominantBaseline="middle" textAnchor="middle" dy=".125em">
            {initials}
          </text>
        </svg>
      )}
      {src && <img src={src} alt={alt} />}
    </span>
  )
}

export const AvatarButton = React.forwardRef(function AvatarButton(
  { src, square = false, initials, alt, className, ...props },
  ref
) {
  let classes = cn(
    className,
    square ? 'rounded-[20%]' : 'rounded-full',
    'relative focus:outline-none data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-blue-500'
  )

  return 'href' in props ? (
    <Link {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Headless.Button>
  )
})