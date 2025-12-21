import { Fragment, createContext, useContext, useMemo, useState } from 'react'
import { Transforms, Range } from 'slate'
import { ReactEditor, useSelected, useSlateStatic as useStaticEditor, useReadOnly, type RenderElementProps } from 'slate-react'
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
import { Trash2, Columns } from 'lucide-react'

import { InlineDialog } from './primitives/InlineDialog'
import { ToolbarGroup } from './Toolbar'
import { isElementActive } from './utils'
import { useSlate } from 'slate-react'
import { insertLayout } from './layouts-shared'
import { ToolbarButton, KeyboardInTooltip } from './Toolbar'
import type { DocumentFeatures } from '../../index'
import { useToolbarState } from './toolbar-state'

const LayoutOptionsContext = createContext<[number, ...number[]][]>([])

export const LayoutOptionsProvider = LayoutOptionsContext.Provider

// Hook similar to PlateJS useDebouncePopoverOpen
function useLayoutPopoverOpen() {
  const editor = useStaticEditor()
  const readOnly = useReadOnly()
  const selected = useSelected()
  
  // Check if selection is collapsed (cursor at a single point, not selecting text)
  const selectionCollapsed = editor.selection ? Range.isCollapsed(editor.selection) : true
  
  // Only show popover when: not read-only, element is selected, and cursor is collapsed
  return !readOnly && selected && selectionCollapsed
}

const LayoutPopoverSeparator = () => {
  return <span className="inline-block w-px h-6 mx-1 bg-border" />
}

export function LayoutContainer({ attributes, children, element }: RenderElementProps & { element: { type: 'layout'; layout: number[] } }) {
  const editor = useStaticEditor()
  const isPopoverOpen = useLayoutPopoverOpen()

  const layout = element.layout
  const layoutOptions = useContext(LayoutOptionsContext)

  return (
    <div
      className="relative my-4"
      {...attributes}
    >
      <Popover open={isPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: layout.map(x => `${x}fr`).join(' '),
            }}
          >
            {children}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          sideOffset={4} 
          className="p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ToolbarGroup className="gap-0.5">
            {layoutOptions.map((layoutOption, i) => (
              <ToolbarButton
                key={i}
                isSelected={layoutOption.toString() === layout.toString()}
                onMouseDown={event => {
                  event.preventDefault()
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(editor, {
                    type: 'layout',
                    layout: layoutOption,
                  }, { at: path })
                }}
              >
                {makeLayoutIcon(layoutOption)}
              </ToolbarButton>
            ))}
            <LayoutPopoverSeparator />
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton
                  variant="destructive"
                  onMouseDown={event => {
                    event.preventDefault()
                    const path = ReactEditor.findPath(editor, element)
                    Transforms.removeNodes(editor, { at: path })
                  }}
                >
                  <Trash2 size={16} />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent>
                <span>Remove</span>
              </TooltipContent>
            </Tooltip>
          </ToolbarGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function LayoutArea({ attributes, children }: RenderElementProps) {
  return (
    <div
      className="border-2 border-dashed border-border rounded-sm px-4"
      {...attributes}
    >
      {children}
    </div>
  )
}

function makeLayoutIcon(ratios: number[]) {
  return (
    <div
      role="img"
      className="grid gap-0.5 w-4 h-4"
      style={{
        gridTemplateColumns: ratios.map(r => `${r}fr`).join(' '),
      }}
    >
      {ratios.map((_, i) => (
        <div key={i} className="bg-current rounded-[1px]" />
      ))}
    </div>
  )
}

export function LayoutsButton({ layouts }: { layouts: DocumentFeatures['layouts'] }) {
  const editor = useSlate()
  const { layouts: layoutState } = useToolbarState()
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarButton
          isSelected={layoutState.isSelected}
          onMouseDown={event => {
            event.preventDefault()
            if (layoutState.isSelected && isElementActive(editor, 'layout')) {
              Transforms.unwrapNodes(editor, {
                match: node => (node as any).type === 'layout',
              })
              return
            }
            insertLayout(editor, layouts[0])
          }}
        >
          <Columns size={16} />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent>
        <span>Layouts</span>
      </TooltipContent>
    </Tooltip>
  )
}