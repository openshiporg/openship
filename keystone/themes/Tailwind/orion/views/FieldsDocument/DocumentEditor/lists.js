import { forwardRef, useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui/tooltip'
import { List, ListOrdered } from 'lucide-react'
import { useToolbarState } from './toolbar-state'
import { ToolbarButton } from './Toolbar'
import { toggleList } from './lists-shared'

export const isListType = (type) =>
  type === 'ordered-list' || type === 'unordered-list'

export const isListNode = node => isListType(node.type)

export const ListButton = forwardRef(function ListButton({ type, children }, ref) {
  const {
    editor,
    lists: { [type === 'ordered-list' ? 'ordered' : 'unordered']: { isDisabled, isSelected } },
  } = useToolbarState()

  return (
    <ToolbarButton
      ref={ref}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        toggleList(editor, type)
      }}
    >
      {children}
    </ToolbarButton>
  )
})

export const unorderedListButton = (
  <Tooltip>
    <TooltipTrigger asChild>
      <ListButton type="unordered-list">
        <List size={16} />
      </ListButton>
    </TooltipTrigger>
    <TooltipContent>
      Bullet List <kbd className="ml-2 text-xs">-</kbd>
    </TooltipContent>
  </Tooltip>
)

export const orderedListButton = (
  <Tooltip>
    <TooltipTrigger asChild>
      <ListButton type="ordered-list">
        <ListOrdered size={16} />
      </ListButton>
    </TooltipTrigger>
    <TooltipContent>
      Numbered List <kbd className="ml-2 text-xs">1.</kbd>
    </TooltipContent>
  </Tooltip>
)
