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
import { ToolbarButton } from '../primitives'
import { TooltipWithShortcut } from '../Toolbar'
import { Trash2Icon } from 'lucide-react'

export function ChromelessComponentBlockElement(props) {
  return (
    <div
      {...props.attributes}
      className="my-8"
    >
      <Popover open={props.isOpen}>
        <PopoverTrigger asChild>
          <div>
            {props.renderedBlock}
          </div>
        </PopoverTrigger>
        {props.isOpen && (
          <PopoverContent align="start" sideOffset={4} className="p-1">
            <ChromelessToolbar 
              onRemove={props.onRemove} 
              props={props.previewProps} 
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}

function DefaultToolbarWithoutChrome({ onRemove }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          variant="destructive"
          onMouseDown={event => {
            event.preventDefault()
            onRemove()
          }}
        >
          <Trash2Icon size="small" />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipWithShortcut>Remove</TooltipWithShortcut>
    </Tooltip>
  )
}
