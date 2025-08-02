import { forwardRef, type ReactNode } from 'react'
import { type Node, type Element } from 'slate'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { List, ListOrdered } from 'lucide-react'
import { useToolbarState } from './toolbar-state'
import { ToolbarButton } from './Toolbar'
import { toggleList } from './lists-shared'

export const isListType = (type: string | undefined) =>
  type === 'ordered-list' || type === 'unordered-list'

export const isListNode = (
  node: Node
): node is Element & { type: 'ordered-list' | 'unordered-list' } => 
  'type' in node && isListType(node.type)

interface ListButtonProps {
  type: 'ordered-list' | 'unordered-list'
  children: ReactNode
}

export const ListButton = forwardRef<HTMLButtonElement, ListButtonProps>(
  function ListButton({ type, children }, ref) {
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
  }
)

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

// Add the ListButtons component for compatibility with existing usage
export function ListButtons(props: { lists: { ordered: boolean; unordered: boolean } }) {
  return (
    <>
      {props.lists.unordered && unorderedListButton}
      {props.lists.ordered && orderedListButton}
    </>
  )
}