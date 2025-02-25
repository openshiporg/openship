import { AlignLeft, AlignRight, AlignCenter, ChevronDown } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ui/popover'
import { Fragment, useMemo, useState } from 'react'
import { Transforms } from 'slate'

import { ToolbarGroup } from './primitives'
import { useToolbarState } from './toolbar-state'
import { ToolbarButton, TooltipWithShortcut } from './Toolbar'

export function TextAlignMenu({ alignment }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Fragment>
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger>
          <TextAlignButton showMenu={showMenu} />
        </PopoverTrigger>
        <TextAlignDialog 
          alignment={alignment} 
          onSelect={() => setShowMenu(false)}
        />
      </Popover>
    </Fragment>
  );
}

function TextAlignButton({ showMenu }) {
  const {
    alignment: { isDisabled, selected },
  } = useToolbarState();

  return useMemo(
    () => (
      <ToolbarButton
        isDisabled={isDisabled}
        isPressed={showMenu}
        className="w-auto px-2 flex items-center gap-1"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {alignmentIcons[selected]}
        <ChevronDown size={16} />
      </ToolbarButton>
    ),
    [isDisabled, selected, showMenu]
  );
}

function TextAlignDialog({ alignment, onSelect }) {
  const {
    alignment: { selected },
    editor,
  } = useToolbarState();

  const alignments = ['start', ...(Object.keys(alignment)).filter(key => alignment[key])];

  return (
    <PopoverContent align="start" sideOffset={4} className="p-1 w-auto">
      <ToolbarGroup>
        {alignments.map(alignment => (
          <Tooltip key={alignment}>
            <TooltipTrigger>
              <ToolbarButton
                isSelected={selected === alignment}
                onMouseDown={event => {
                  event.preventDefault();
                  if (alignment === 'start') {
                    Transforms.unsetNodes(editor, 'textAlign', {
                      match: node => node.type === 'paragraph' || node.type === 'heading',
                    });
                  } else {
                    Transforms.setNodes(editor, { textAlign: alignment }, {
                      match: node => node.type === 'paragraph' || node.type === 'heading',
                    });
                  }
                  onSelect();
                }}
              >
                {alignmentIcons[alignment]}
              </ToolbarButton>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2 py-0 dark">
              <span className="text-xs tracking-wide font-medium uppercase">{`Align ${alignment}`}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </ToolbarGroup>
    </PopoverContent>
  );
}

const alignmentIcons = {
  start: <AlignLeft size={16} />,
  center: <AlignCenter size={16} />,
  end: <AlignRight size={16} />,
}
