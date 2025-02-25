import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui/tooltip'
import { useMemo } from 'react'
import { Transforms } from 'slate'
import { Code } from 'lucide-react'
import { useToolbarState } from './toolbar-state'
import { ToolbarButton, TooltipWithShortcut } from './Toolbar'

export * from './code-block-shared'

function CodeButton() {
  const {
    editor,
    code: { isDisabled, isSelected },
  } = useToolbarState()

  return (
    <ToolbarButton
      isSelected={isSelected}
      isDisabled={isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        if (isSelected) {
          Transforms.unwrapNodes(editor, { match: node => node.type === 'code' })
        } else {
          Transforms.wrapNodes(editor, { type: 'code', children: [{ text: '' }] })
        }
      }}
    >
      <Code size={16} />
    </ToolbarButton>
  )
}

export const codeButton = (
  <Tooltip>
    <TooltipTrigger>
      <CodeButton />
    </TooltipTrigger>
    <TooltipWithShortcut shortcut="```">Code block</TooltipWithShortcut>
  </Tooltip>
)
