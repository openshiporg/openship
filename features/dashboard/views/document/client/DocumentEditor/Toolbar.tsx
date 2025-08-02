import {
  Fragment,
  forwardRef,
  useState,
  useMemo,
  useContext,
  createContext,
  type ReactNode,
} from 'react'
import { Editor, Transforms } from 'slate'
import { useSlateStatic } from 'slate-react'
import { applyRefs } from 'apply-ref'
import { cn } from '@/lib/utils'

import { useControlledPopover } from './use-controlled-popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button, buttonVariants } from '@/components/ui/button'

import {
  Bold,
  Italic,
  Plus,
  ChevronDown,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  List,
  ListOrdered,
} from 'lucide-react'

import { type DocumentFeatures } from '../views-shared'
import { InlineDialog } from './primitives/InlineDialog'
import { linkButton } from './link'
import {
  BlockComponentsButtons,
  ComponentBlockContext,
} from './component-blocks'
import { clearFormatting, modifierKeyText } from './utils'
import { LayoutsButton } from './layouts'
import { ListButton, unorderedListButton, orderedListButton } from './lists'
import { blockquoteButton } from './blockquote'
import {
  DocumentFieldRelationshipsContext,
  RelationshipButton,
} from './relationship'
import { codeButton } from './code-block'
import { TextAlignMenu } from './alignment'
import { dividerButton } from './divider'
import { useToolbarState } from './toolbar-state'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// Add this near the top of the file
const isMac =
  typeof window !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

// Toolbar Primitives
// ------------------------------

export const ToolbarSpacer = () => {
  return <span className="inline-block w-6" />
}

export const ToolbarSeparator = () => {
  return (
    <span className="inline-block w-px h-full mx-2 bg-border self-stretch" />
  )
}

const directionToAlignment = {
  row: 'center',
  column: 'start',
}

const ToolbarGroupContext = createContext({ direction: 'row' })
const useToolbarGroupContext = () => useContext(ToolbarGroupContext)

export const ToolbarGroup = forwardRef<HTMLDivElement, { children: ReactNode; direction?: 'row' | 'column'; className?: string }>(
  ({ children, direction = 'row', className, ...props }, ref) => {
    return (
      <ToolbarGroupContext.Provider value={{ direction }}>
        <div
          ref={ref}
          className={cn(
            'flex gap-1',
            direction === 'row'
              ? 'flex-row items-center'
              : 'flex-col items-start',
            'h-full overflow-hidden',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToolbarGroupContext.Provider>
    )
  }
)

ToolbarGroup.displayName = 'ToolbarGroup'

export const ToolbarButton = forwardRef<HTMLButtonElement, { isDisabled?: boolean; isPressed?: boolean; isSelected?: boolean; variant?: string; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ isDisabled, isPressed, isSelected, variant = 'ghost', className, ...props }, ref) => {
    const { direction: groupDirection } = useToolbarGroupContext()

    // Determine the actual variant based on state
    const actualVariant = isSelected ? 'secondary' : variant

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        data-pressed={isPressed}
        data-selected={isSelected}
        data-display-mode={groupDirection}
        variant={actualVariant as any}
        size={groupDirection === 'row' ? 'icon' : 'sm'}
        className={cn(
          // Base styles for all toolbar buttons
          'h-8',
          groupDirection === 'row'
            ? 'w-8 justify-center' // Icon buttons in toolbar
            : 'w-full justify-start text-left', // Menu items in dropdowns
          className
        )}
        {...props}
      />
    )
  }
)

ToolbarButton.displayName = 'ToolbarButton'

export function KeyboardInTooltip({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-auto px-1 py-0 text-[10px] font-sans font-medium bg-muted text-foreground/80 rounded">
      {children}
    </kbd>
  )
}

export function Toolbar({ documentFeatures, viewState }: {
  documentFeatures: DocumentFeatures
  viewState?: { expanded: boolean; toggle: () => void }
}) {
  const relationship = useContext(DocumentFieldRelationshipsContext)
  const blockComponent = useContext(ComponentBlockContext)
  const hasBlockItems =
    Object.entries(relationship).length || Object.keys(blockComponent).length
  const hasMarks = Object.values(documentFeatures.formatting.inlineMarks).some(
    (x) => x
  )

  return (
    <TooltipProvider>
      <ToolbarContainer>
        <ToolbarGroup>
          {!!documentFeatures.formatting.headingLevels.length && (
            <HeadingMenu
              headingLevels={documentFeatures.formatting.headingLevels}
            />
          )}
          {hasMarks && (
            <InlineMarks marks={documentFeatures.formatting.inlineMarks} />
          )}
          {hasMarks && <Separator orientation="vertical" />}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end) && (
            <TextAlignMenu alignment={documentFeatures.formatting.alignment} />
          )}
          {documentFeatures.formatting.listTypes.unordered && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ListButton type="unordered-list">
                  <List size={16} />
                </ListButton>
              </TooltipTrigger>

              <TooltipWithShortcut shortcut="-">
                Bullet List
              </TooltipWithShortcut>
            </Tooltip>
          )}
          {documentFeatures.formatting.listTypes.ordered && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ListButton type="ordered-list">
                  <ListOrdered size={16} />
                </ListButton>
              </TooltipTrigger>
              <TooltipWithShortcut shortcut="1.">
                Numbered List
              </TooltipWithShortcut>
            </Tooltip>
          )}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end ||
            documentFeatures.formatting.listTypes.unordered ||
            documentFeatures.formatting.listTypes.ordered) && (
            <Separator orientation="vertical"/>
          )}

          {documentFeatures.dividers && dividerButton}
          {documentFeatures.links && linkButton}
          {documentFeatures.formatting.blockTypes.blockquote &&
            blockquoteButton}
          {!!documentFeatures.layouts.length && (
            <LayoutsButton layouts={documentFeatures.layouts} />
          )}
          {documentFeatures.formatting.blockTypes.code && codeButton}
          {!!hasBlockItems && <InsertBlockMenu />}
        </ToolbarGroup>
        <Separator orientation="vertical"/>
          {useMemo(() => {
            const ExpandIcon = viewState?.expanded ? Minimize2 : Maximize2
            return (
              viewState && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToolbarButton
                      onMouseDown={(event) => {
                        event.preventDefault()
                        viewState.toggle()
                      }}
                      className="mx-2"
                    >
                      <ExpandIcon />
                    </ToolbarButton>
                  </TooltipTrigger>
                  <TooltipWithShortcut>
                    {viewState.expanded ? 'Collapse' : 'Expand'}
                  </TooltipWithShortcut>
                </Tooltip>
              )
            )
          }, [viewState])}
      </ToolbarContainer>
    </TooltipProvider>
  )
}

/* UI Components */

interface MarkButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  markType: string
  children: ReactNode
}

const MarkButton = forwardRef<HTMLButtonElement, MarkButtonProps>(function MarkButton(props, ref) {
  const {
    editor,
    marks
  } = useToolbarState()
  const mark = marks[props.markType as keyof typeof marks]
  if (!mark) return null

  return useMemo(() => {
    const { markType, ...restProps } = props
    return (
      <ToolbarButton
        ref={ref}
        isDisabled={mark.isDisabled}
        isSelected={mark.isSelected}
        onMouseDown={(event) => {
          event.preventDefault()
          if (mark.isSelected) {
            Editor.removeMark(editor, props.markType)
          } else {
            Editor.addMark(editor, props.markType, true)
          }
        }}
        {...restProps}
      />
    )
  }, [editor, mark.isDisabled, mark.isSelected, props, ref])
})

const ToolbarContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="sticky top-0 z-20 border-b">
      <div className="flex flex-row justify-between items-center h-10">
        {children}
      </div>
    </div>
  )
}

const downIcon = <ChevronDown size={16} />

function HeadingMenu({ headingLevels }: { headingLevels: DocumentFeatures['formatting']['headingLevels'] }) {
  const [showMenu, setShowMenu] = useState(false)
  const { textStyles } = useToolbarState()
  const isDisabled = textStyles.allowedHeadingLevels.length === 0
  const buttonLabel =
    textStyles.selected === 'normal'
      ? 'Normal text'
      : 'Heading ' + textStyles.selected

  return (
    <div className="inline-block relative px-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <ToolbarButton
                isDisabled={isDisabled}
                isPressed={showMenu}
                variant="outline"
                className="w-[116px] px-2 flex items-center justify-between rounded-sm"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setShowMenu((v) => !v)
                }}
              >
                <span className="flex-1 text-left">{buttonLabel}</span>
                <ChevronDown size={16} />
              </ToolbarButton>
            </PopoverTrigger>
            <HeadingDialog
              headingLevels={headingLevels}
              onSelect={() => setShowMenu(false)}
            />
          </Popover>
        </TooltipTrigger>
        <TooltipWithShortcut>Headings</TooltipWithShortcut>
      </Tooltip>
    </div>
  )
}

function HeadingDialog({ headingLevels, onSelect }: {
  headingLevels: DocumentFeatures['formatting']['headingLevels']
  onSelect: () => void
}) {
  const { editor, textStyles } = useToolbarState()

  return (
    <PopoverContent align="start" className="p-1">
      <ToolbarGroup direction="column">
        {headingLevels.map((hNum) => {
          const isSelected = textStyles.selected === hNum
          return (
            <ToolbarButton
              key={hNum}
              isSelected={isSelected}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (isSelected) {
                  Transforms.unwrapNodes(editor, {
                    match: (n) => (n as any).type === 'heading',
                  })
                } else {
                  Transforms.setNodes(
                    editor,
                    { type: 'heading', level: hNum },
                    {
                      match: (node) =>
                        (node as any).type === 'paragraph' || (node as any).type === 'heading',
                    }
                  )
                }
                onSelect()
              }}
            >
              {hNum === 1 ? (
                <span className="text-2xl font-bold">Heading 1</span>
              ) : hNum === 2 ? (
                <span className="text-xl font-bold">Heading 2</span>
              ) : hNum === 3 ? (
                <span className="text-lg font-bold">Heading 3</span>
              ) : hNum === 4 ? (
                <span className="text-base font-bold">Heading 4</span>
              ) : hNum === 5 ? (
                <span className="text-sm font-bold">Heading 5</span>
              ) : (
                <span className="text-xs font-bold">Heading 6</span>
              )}
            </ToolbarButton>
          )
        })}
        <ToolbarButton
          isSelected={textStyles.selected === 'normal'}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            Transforms.unwrapNodes(editor, {
              match: (n) => (n as any).type === 'heading',
            })
            onSelect()
          }}
        >
          <span className="text-sm">Normal text</span>
        </ToolbarButton>
      </ToolbarGroup>
    </PopoverContent>
  )
}

function InsertBlockMenu() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="inline-block relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <ToolbarButton
                isPressed={showMenu}
                onMouseDown={(event) => {
                  event.preventDefault()
                  setShowMenu((v) => !v)
                }}
              >
                <Plus className="stroke-[3]" size={16} />
                <ChevronDown size={16} />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1">
              <ToolbarGroup direction="column">
                <RelationshipButton onClose={() => setShowMenu(false)} />
                <BlockComponentsButtons onClose={() => setShowMenu(false)} />
              </ToolbarGroup>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipWithShortcut shortcut="/">Insert</TooltipWithShortcut>
      </Tooltip>
    </div>
  )
}

function InlineMarks({ marks }: { marks: DocumentFeatures['formatting']['inlineMarks'] }) {
  const [showMenu, setShowMenu] = useState(false)
  const {
    editor,
    clearFormatting: { isDisabled },
  } = useToolbarState()

  return (
    <Fragment>
      {marks.bold && (
        <Tooltip>
          <TooltipTrigger asChild>
            <MarkButton markType="bold">
              <Bold className="stroke-[3]" size={16} />
            </MarkButton>
          </TooltipTrigger>
          <TooltipWithShortcut shortcut={isMac ? '⌘B' : 'Ctrl+B'}>
            Bold
          </TooltipWithShortcut>
        </Tooltip>
      )}
      {marks.italic && (
        <Tooltip>
          <TooltipTrigger asChild>
            <MarkButton markType="italic">
              <Italic size={16} />
            </MarkButton>
          </TooltipTrigger>
          <TooltipWithShortcut shortcut={isMac ? '⌘I' : 'Ctrl+I'}>
            Italic
          </TooltipWithShortcut>
        </Tooltip>
      )}

      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <MoreFormattingButton showMenu={showMenu} />
            </TooltipTrigger>
            <TooltipWithShortcut>More Formatting</TooltipWithShortcut>
          </Tooltip>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-1">
          <ToolbarGroup direction="column">
            {marks.underline && (
              <MarkButton markType="underline">
                <ContentInButtonWithShortcut
                  content="Underline"
                  shortcut="Ctrl+U"
                />
              </MarkButton>
            )}
            {marks.strikethrough && (
              <MarkButton markType="strikethrough">
                <ContentInButtonWithShortcut content="Strikethrough" />
              </MarkButton>
            )}
            {marks.code && (
              <MarkButton markType="code">
                <ContentInButtonWithShortcut content="Code" />
              </MarkButton>
            )}
            {marks.keyboard && (
              <MarkButton markType="keyboard">
                <ContentInButtonWithShortcut content="Keyboard" />
              </MarkButton>
            )}
            {marks.subscript && (
              <MarkButton markType="subscript">
                <ContentInButtonWithShortcut content="Subscript" />
              </MarkButton>
            )}
            {marks.superscript && (
              <MarkButton markType="superscript">
                <ContentInButtonWithShortcut content="Superscript" />
              </MarkButton>
            )}
            <Separator />
            <ToolbarButton
              isDisabled={isDisabled}
              onMouseDown={(event) => {
                event.preventDefault()
                clearFormatting(editor)
              }}
            >
              <ContentInButtonWithShortcut content="Clear formatting" />
            </ToolbarButton>
          </ToolbarGroup>
        </PopoverContent>
      </Popover>
    </Fragment>
  )
}

const MoreFormattingButton = forwardRef<HTMLButtonElement, { showMenu: boolean }>(
  ({ showMenu }, ref) => {
    return (
      <ToolbarButton ref={ref} isPressed={showMenu}>
        <MoreHorizontal size={16} />
      </ToolbarButton>
    )
  }
)

MoreFormattingButton.displayName = 'MoreFormattingButton'

const TooltipWithShortcut = ({
  children,
  shortcut
}: {
  children: ReactNode
  shortcut?: string
}) => {
  return (
    <TooltipContent side="bottom">
      <span className="flex items-center gap-2">
        <span>{children}</span>
        {shortcut && <KeyboardInTooltip>{shortcut}</KeyboardInTooltip>}
      </span>
    </TooltipContent>
  )
}

function ContentInButtonWithShortcut({
  content,
  shortcut
}: {
  content: string
  shortcut?: string
}) {
  return (
    <span className="flex items-center justify-between text-xs">
      <span>{content}</span>
      {shortcut && (
        <span className="text-muted-foreground">{shortcut}</span>
      )}
    </span>
  )
}

// Custom (non-feather) Icons
// ------------------------------

export const IconBase = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    focusable="false"
    height="16"
    role="presentation"
    viewBox="0 0 16 16"
    width="16"
    {...props}
  />
)