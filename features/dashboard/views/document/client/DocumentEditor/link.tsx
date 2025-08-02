import { Fragment, useState, useEffect, type ReactNode } from 'react'
import { ReactEditor, useSelected, useFocused, type RenderElementProps } from 'slate-react'
import { Transforms } from 'slate'
import { forwardRef } from 'react'
import { useSlateStatic as useStaticEditor } from 'slate-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'

import { ToolbarButton } from './Toolbar'
import { useToolbarState } from './toolbar-state'
import { wrapLink } from './link-shared'
import { KeyboardInTooltip } from './Toolbar'
import { Link2, Trash2, ExternalLink } from 'lucide-react'
import { useElementWithSetNodes } from './utils-hooks'
import { isValidURL } from './isValidURL'
import { useForceValidation } from './utils-hooks'

export * from './link-shared'

export const LinkElement = ({
  attributes,
  children,
  element: __elementForGettingPath
}: RenderElementProps & { element: { type: 'link'; href: string } }) => {
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
          <a
            href={href}
            className={
              showInvalidState
                ? "text-red-500"
                : "text-blue-500 hover:text-blue-600"
            }
          >
            {children}
          </a>
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
    <TooltipContent side="bottom">
      <span className="flex items-center gap-2">
        <span>Link</span>
      </span>
    </TooltipContent>
  </Tooltip>
)