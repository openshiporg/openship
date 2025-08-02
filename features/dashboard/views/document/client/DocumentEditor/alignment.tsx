import { AlignLeft, AlignRight, AlignCenter, ChevronDown } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Fragment, useMemo, useState } from 'react'
import { Transforms } from 'slate'

import { ToolbarGroup } from './Toolbar'
import { useToolbarState } from './toolbar-state'
import { ToolbarButton, KeyboardInTooltip } from './Toolbar'
import type { DocumentFeatures } from '../views-shared'

export function TextAlignMenu({ alignment }: {
  alignment: DocumentFeatures['formatting']['alignment']
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Fragment>
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger asChild>
          <TextAlignButton showMenu={showMenu} />
        </PopoverTrigger>
        <TextAlignDialog 
          alignment={alignment} 
          onSelect={() => setShowMenu(false)}
        />
      </Popover>
    </Fragment>
  )
}

function TextAlignButton({ showMenu }: { showMenu: boolean }) {
  const {
    alignment: { isDisabled, selected },
  } = useToolbarState()

  return useMemo(
    () => (
      <ToolbarButton
        isDisabled={isDisabled}
        isPressed={showMenu}
        className="w-auto px-2 flex items-center gap-1"
        onMouseDown={(event) => {
          event.preventDefault()
        }}
      >
        {alignmentIcons[selected]}
        <ChevronDown size={16} />
      </ToolbarButton>
    ),
    [isDisabled, selected, showMenu]
  )
}

function TextAlignDialog({ alignment, onSelect }: {
  alignment: DocumentFeatures['formatting']['alignment']
  onSelect: () => void
}) {
  const {
    alignment: { selected },
    editor,
  } = useToolbarState()

  const alignments: Array<'start' | 'center' | 'end'> = ['start', ...(Object.keys(alignment)).filter(key => alignment[key as keyof typeof alignment])] as Array<'start' | 'center' | 'end'>

  return (
    <PopoverContent align="start" sideOffset={4} className="p-1 w-auto">
      <ToolbarGroup>
        {alignments.map(alignment => (
          <Tooltip key={alignment}>
            <TooltipTrigger asChild>
              <ToolbarButton
                isSelected={selected === alignment}
                onMouseDown={event => {
                  event.preventDefault()
                  if (alignment === 'start') {
                    Transforms.unsetNodes(editor, 'textAlign' as any, {
                      match: node => (node as any).type === 'paragraph' || (node as any).type === 'heading',
                    })
                  } else {
                    Transforms.setNodes(editor, { textAlign: alignment } as any, {
                      match: node => (node as any).type === 'paragraph' || (node as any).type === 'heading',
                    })
                  }
                  onSelect()
                }}
              >
                {alignmentIcons[alignment]}
              </ToolbarButton>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              <span>{`Align ${alignment}`}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </ToolbarGroup>
    </PopoverContent>
  )
}

const alignmentIcons = {
  start: <AlignLeft size={16} />,
  center: <AlignCenter size={16} />,
  end: <AlignRight size={16} />,
}