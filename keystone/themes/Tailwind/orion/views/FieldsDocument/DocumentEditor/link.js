import { Fragment, useState, useEffect } from 'react'
import { ReactEditor, useSelected, useFocused } from "slate-react"
import { Transforms } from "slate"
import { forwardRef } from "react"
import { useSlateStatic as useStaticEditor } from "slate-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from "@ui/popover"
import { Input } from "@ui/input"
import { Button, buttonVariants } from "@ui/button"

import { IconBase, ToolbarButton } from './Toolbar'
import { useToolbarState } from './toolbar-state'
import { wrapLink } from './link-shared'
import { TooltipWithShortcut } from './Toolbar'
import { Link2, Trash2, ExternalLink } from 'lucide-react'
import { useElementWithSetNodes, useForceValidation } from "./utils-hooks"
import { isValidURL } from "./isValidURL"

export * from './link-shared'

export const LinkElement = ({
  attributes,
  children,
  element: __elementForGettingPath
}) => {
  const editor = useStaticEditor()
  const selected = useSelected()
  const focused = useFocused()
  const [focusedInInlineDialog, setFocusedInInlineDialog] = useState(false)
  const [delayedFocused, setDelayedFocused] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setDelayedFocused(focused)
    }, 0)
    return () => {
      clearTimeout(id)
    }
  }, [focused])

  const [currentElement, setNode] = useElementWithSetNodes(
    editor,
    __elementForGettingPath
  )
  const href = currentElement.href
  const [localForceValidation, setLocalForceValidation] = useState(false)
  const forceValidation = useForceValidation()
  const showInvalidState = isValidURL(href)
    ? false
    : forceValidation || localForceValidation

  return (
    <span {...attributes} className="relative inline-block">
      <Popover open={(selected && focused) || focusedInInlineDialog}>
        <PopoverTrigger asChild>
          <text
            className={
              showInvalidState
                ? "text-red-500"
                : "text-blue-500 hover:text-blue-600"
            }
          >
            {children}
          </text>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          sideOffset={4} 
          className="w-[280px] p-3"
          onFocusCapture={() => {
            setFocusedInInlineDialog(true)
          }}
          onBlurCapture={() => {
            setFocusedInInlineDialog(false)
            setLocalForceValidation(true)
          }}
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                className="h-8"
                placeholder="Enter URL"
                value={href}
                onChange={(event) => {
                  setNode({ href: event.target.value })
                }}
                onBlur={() => {
                  setLocalForceValidation(true)
                }}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={buttonVariants({
                    size: "icon",
                    variant: "outline",
                  })}
                >
                  <ExternalLink size={16} />
                </a>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    Transforms.unwrapNodes(editor, {
                      at: ReactEditor.findPath(editor, __elementForGettingPath),
                    })
                  }}
                >
                  <Trash2 className="text-red-500" size={16} />
                </Button>
              </div>
            </div>
            {showInvalidState && (
              <p className="text-xs text-red-500">Please enter a valid URL</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </span>
  )
}

const LinkButton = () => {
  const {
    editor,
    links: { isDisabled, isSelected },
  } = useToolbarState()
  
  return (
    <ToolbarButton
      isSelected={isSelected}
      isDisabled={isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        wrapLink(editor, '')
      }}
    >
      <Link2 size={16} />
    </ToolbarButton>
  )
}

export const linkButton = (
  <Tooltip>
    <TooltipTrigger asChild>
      <LinkButton />
    </TooltipTrigger>
    <TooltipWithShortcut>Link</TooltipWithShortcut>
  </Tooltip>
)

const QuoteIcon = () => (
  <IconBase>
    <path d="M11.3031 2C9.83843 2 8.64879 3.22321 8.64879 4.73171C8.64879 6.23928 9.83843 7.46342 11.3031 7.46342C13.8195 7.46342 12.3613 12.2071 9.18767 12.7012C9.03793 12.7239 8.90127 12.7995 8.80243 12.9143C8.70358 13.029 8.64908 13.1754 8.64879 13.3268C8.64879 13.7147 8.99561 14.0214 9.37973 13.9627C15.148 13.0881 17.1991 2.00093 11.3031 2.00093V2ZM3.65526 2C2.18871 2 1 3.22228 1 4.73171C1 6.23835 2.18871 7.46155 3.65526 7.46155C6.17067 7.46155 4.71252 12.2071 1.53888 12.7012C1.3893 12.7239 1.25277 12.7993 1.15394 12.9139C1.05511 13.0285 1.00051 13.1746 1 13.3259C1 13.7137 1.34682 14.0205 1.73001 13.9617C7.50016 13.0872 9.55128 2 3.65526 2Z" />
  </IconBase>
)
