import { createContext, useContext } from 'react'
import { cn } from '@keystone/utils/cn'

// Spacers and Separators
// ------------------------------

export const ToolbarSpacer = () => {
  return <span className="inline-block w-6" />
}

export const ToolbarSeparator = () => {
  return (
    <span
      className="inline-block h-full w-px mx-2 self-stretch bg-border"
    />
  )
}

const directionToAlignment = {
  row: 'center',
  column: 'start',
}

const ToolbarGroupContext = createContext({ direction: 'row' })
const useToolbarGroupContext = () => useContext(ToolbarGroupContext)

export const ToolbarGroup = ({ children, direction = 'row', className, ...props }) => {
  return (
    <ToolbarGroupContext.Provider value={{ direction }}>
      <div
        className={cn(
          'flex gap-1',
          direction === 'row' ? 'flex-row' : 'flex-col',
          direction === 'row' ? 'items-center' : 'items-start',
          'justify-start h-full overflow-x-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ToolbarGroupContext.Provider>
  )
}

export const ToolbarButton = ({
  as: Tag = 'button',
  isDisabled,
  isPressed,
  isSelected,
  variant = 'default',
  className,
  ...props
}) => {
  const extraProps = {}
  const { direction: groupDirection } = useToolbarGroupContext()

  if (Tag === 'button') {
    extraProps.type = 'button'
  }

  const variants = {
    default: 'hover:bg-accent active:bg-accent/80 text-foreground',
    action: 'hover:bg-blue-100 active:bg-blue-200 text-blue-600',
    destructive: 'hover:bg-red-100 active:bg-red-200 text-red-600',
  }

  return (
    <Tag
      {...extraProps}
      disabled={isDisabled}
      data-pressed={isPressed}
      data-selected={isSelected}
      data-display-mode={groupDirection}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        isSelected && 'bg-foreground text-background',
        groupDirection === 'row' ? 'px-3' : 'px-4 w-full',
        'h-9',
        className
      )}
      {...props}
    />
  )
}

export function KeyboardInTooltip({ children }) {
  return (
    <kbd
      className="mx-0.5 px-1 font-inherit bg-foreground text-background rounded-sm whitespace-pre"
    >
      {children}
    </kbd>
  )
}
