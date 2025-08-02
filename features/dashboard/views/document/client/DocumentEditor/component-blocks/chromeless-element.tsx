import { type ReactNode } from 'react'
import type { RenderElementProps } from 'slate-react'
import type { ComponentBlock, PreviewPropsForToolbar, ObjectField, ComponentSchema } from './api'
import { Button } from '@/components/ui/button' 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2 } from 'lucide-react' // Example icon import
import { BlockPopoverTrigger, BlockPopover } from '../primitives/BlockPopover'
import { blockElementSpacing } from '../utils-hooks'
import { type Element } from 'slate'

export function ChromelessComponentBlockElement(props: {
  renderedBlock: ReactNode
  componentBlock: ComponentBlock & { chromeless: true }
  previewProps: PreviewPropsForToolbar<ObjectField<Record<string, ComponentSchema>>>
  onRemove: () => void
  attributes: RenderElementProps['attributes']
  element: Element
}) {
  const hasToolbar = props.componentBlock.toolbar !== null
  const ChromelessToolbar = props.componentBlock.toolbar ?? DefaultToolbarWithoutChrome

  return (
    <div {...props.attributes} className={blockElementSpacing}>
      {hasToolbar ? (
        <BlockPopoverTrigger element={props.element}>
          <div>{props.renderedBlock}</div>
          <BlockPopover placement="bottom">
            <ChromelessToolbar onRemove={props.onRemove} props={props.previewProps} />
          </BlockPopover>
        </BlockPopoverTrigger>
      ) : (
        <div>{props.renderedBlock}</div>
      )}
    </div>
  )
}

function DefaultToolbarWithoutChrome({
  onRemove,
}: {
  onRemove(): void
  props: Record<string, any>
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onRemove} className="m-1"> {/* Adjusted margin/padding with Tailwind */}
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Remove</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
