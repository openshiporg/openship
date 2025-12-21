import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useMemo } from 'react'
import { Transforms } from 'slate'
import { Code } from 'lucide-react'
import { useSlate } from 'slate-react'
import { ToolbarButton, KeyboardInTooltip } from './Toolbar'
import { useToolbarState } from './toolbar-state'

export * from './code-block-shared'

function CodeButton() {
  const editor = useSlate()
  const { code } = useToolbarState()

  return (
    <ToolbarButton
      isSelected={code.isSelected}
      isDisabled={code.isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        if (code.isSelected) {
          Transforms.unwrapNodes(editor, { match: node => (node as any).type === 'code' })
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
    <TooltipTrigger asChild>
      <CodeButton />
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <span className="flex items-center gap-2">
        <span>Code block</span>
        <KeyboardInTooltip>```</KeyboardInTooltip>
      </span>
    </TooltipContent>
  </Tooltip>
)