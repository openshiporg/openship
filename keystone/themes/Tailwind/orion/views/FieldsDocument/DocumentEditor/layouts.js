import { Fragment, createContext, useContext, useMemo, useState } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useFocused, useSelected, useSlateStatic as useStaticEditor } from 'slate-react'
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
import { Trash2, Columns } from 'lucide-react'

import { InlineDialog, ToolbarGroup, ToolbarSeparator } from './primitives'
import { isElementActive } from './utils'
import { useToolbarState } from './toolbar-state'
import { insertLayout } from './layouts-shared'
import { ToolbarButton, TooltipWithShortcut } from './Toolbar'

const LayoutOptionsContext = createContext([])

export const LayoutOptionsProvider = LayoutOptionsContext.Provider

export function LayoutContainer({ attributes, children, element }) {
  const focused = useFocused()
  const selected = useSelected()
  const editor = useStaticEditor()
  const [showMenu, setShowMenu] = useState(false)

  const layout = element.layout
  const layoutOptions = useContext(LayoutOptionsContext)

  return (
    <div
      className="relative my-4"
      {...attributes}
    >
      <Popover open={focused && selected} onOpenChange={setShowMenu}>
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
        <PopoverContent align="start" sideOffset={4} className="p-1">
          <ToolbarGroup>
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
            <ToolbarSeparator />
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
              <TooltipWithShortcut>Remove</TooltipWithShortcut>
            </Tooltip>
          </ToolbarGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function LayoutArea({ attributes, children }) {
  return (
    <div
      className="border-2 border-dashed border-border rounded-sm px-4"
      {...attributes}
    >
      {children}
    </div>
  )
}

function makeLayoutIcon(ratios) {
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

export function LayoutsButton({ layouts }) {
  const {
    editor,
    layouts: { isSelected },
  } = useToolbarState()
  
  return (
    <Tooltip>
      <TooltipTrigger>
        <ToolbarButton
          isSelected={isSelected}
          onMouseDown={event => {
            event.preventDefault()
            if (isElementActive(editor, 'layout')) {
              Transforms.unwrapNodes(editor, {
                match: node => node.type === 'layout',
              })
              return
            }
            insertLayout(editor, layouts[0])
          }}
        >
          <Columns size={16} />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipWithShortcut>Layouts</TooltipWithShortcut>
    </Tooltip>
  )
}
