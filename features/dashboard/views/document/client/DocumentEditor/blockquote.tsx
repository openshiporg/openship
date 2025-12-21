import { useMemo } from 'react'
import { type RenderElementProps } from 'slate-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

import { ToolbarButton } from './Toolbar'
import { useSlate } from 'slate-react'
import { insertBlockquote } from './blockquote-shared'
import { KeyboardInTooltip } from './Toolbar'
import { useToolbarState } from './toolbar-state'

export * from './blockquote-shared'

export const BlockquoteElement = ({
  attributes,
  children
}: RenderElementProps) => {
  return (
    <blockquote
      className="border-l-4 border-neutral-300 text-muted-foreground px-6 my-4"
      {...attributes}
    >
      {children}
    </blockquote>
  )
}

const BlockquoteButton = () => {
  const editor = useSlate()
  const { blockquote } = useToolbarState()

  return (
    <ToolbarButton
      isSelected={blockquote.isSelected}
      isDisabled={blockquote.isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        insertBlockquote(editor)
      }}
    >
      <QuoteIcon />
    </ToolbarButton>
  )
}

export const blockquoteButton = (
  <Tooltip>
    <TooltipTrigger asChild>
      <BlockquoteButton />
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <span className="flex items-center gap-2">
        <span>Quote</span>
        <KeyboardInTooltip>{">"}</KeyboardInTooltip>
      </span>
    </TooltipContent>
  </Tooltip>
)

const QuoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 16" fill="currentColor">
    <path d="M11.3031 2C9.83843 2 8.64879 3.22321 8.64879 4.73171C8.64879 6.23928 9.83843 7.46342 11.3031 7.46342C13.8195 7.46342 12.3613 12.2071 9.18767 12.7012C9.03793 12.7239 8.90127 12.7995 8.80243 12.9143C8.70358 13.029 8.64908 13.1754 8.64879 13.3268C8.64879 13.7147 8.99561 14.0214 9.37973 13.9627C15.148 13.0881 17.1991 2.00093 11.3031 2.00093V2ZM3.65526 2C2.18871 2 1 3.22228 1 4.73171C1 6.23835 2.18871 7.46155 3.65526 7.46155C6.17067 7.46155 4.71252 12.2071 1.53888 12.7012C1.3893 12.7239 1.25277 12.7993 1.15394 12.9139C1.05511 13.0285 1.00051 13.1746 1 13.3259C1 13.7137 1.34682 14.0205 1.73001 13.9617C7.50016 13.0872 9.55128 2 3.65526 2Z" />
  </svg>
)