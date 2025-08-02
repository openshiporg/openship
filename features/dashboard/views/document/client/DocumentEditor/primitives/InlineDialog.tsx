import { createPortal } from 'react-dom'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InlineDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  isRelative?: boolean
  children?: ReactNode
}

export const InlineDialog = forwardRef<HTMLDivElement, InlineDialogProps>(
  ({ isRelative, className, ...props }, ref) => {
    const relativeStyles = isRelative
      ? 'left-1/2 m-3 -translate-x-1/2'
      : ''

    const dialog = (
      <div
        ref={ref}
        contentEditable={false}
        className={cn(
          'absolute z-50 bg-popover text-popover-foreground rounded-md border shadow-md p-1',
          'animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          relativeStyles,
          className
        )}
        {...props}
      />
    )

    if (isRelative) {
      return dialog
    }

    return createPortal(dialog, document.body)
  }
)

InlineDialog.displayName = 'InlineDialog'