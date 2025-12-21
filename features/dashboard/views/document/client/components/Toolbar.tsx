import {
  Fragment,
  forwardRef,
  useState,
  useMemo,
  useContext,
  createContext,
  type ReactNode,
} from 'react'
import { Editor, Transforms, Range, Element, Text } from 'slate'
import { useSlate } from 'slate-react'
import { cn } from '@/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pilcrow,
  Check,
} from 'lucide-react'

import { type DocumentFeatures } from '../../index'
import { InlineDialog } from '../DocumentEditor/primitives/InlineDialog'
import { linkButton } from '../DocumentEditor/link'
import {
  BlockComponentsButtons,
  ComponentBlockContext,
} from '../DocumentEditor/component-blocks'
import { clearFormatting, modifierKeyText } from '../DocumentEditor/utils'
import { LayoutsButton } from '../DocumentEditor/layouts'
import { ListButton, unorderedListButton, orderedListButton } from '../DocumentEditor/lists'
import { blockquoteButton } from '../DocumentEditor/blockquote'
import {
  DocumentFieldRelationshipsContext,
  RelationshipButton,
} from '../DocumentEditor/relationship'
import { codeButton } from '../DocumentEditor/code-block'
import { dividerButton } from '../DocumentEditor/divider'
import { useToolbarState } from '../DocumentEditor/toolbar-state'

// Add this near the top of the file
const isMac =
  typeof window !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

// Toolbar primitives

export const ToolbarSpacer = () => {
  return <span className="inline-block w-6" />
}

export const ToolbarSeparator = () => {
  return <Separator orientation="vertical" className="mx-2 my-1 h-6" />
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

// Toolbar button with proper state management
export const ToolbarButton = forwardRef<HTMLButtonElement, {
  isDisabled?: boolean;
  isPressed?: boolean;
  isSelected?: boolean;
  variant?: string;
  className?: string;
  tooltip?: string;
  children: ReactNode;
  onMouseDown?: (event: React.MouseEvent) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ isDisabled, isPressed, isSelected, variant = 'ghost', className, tooltip, children, onMouseDown, ...props }, ref) => {
    const { direction: groupDirection } = useToolbarGroupContext()

    // Determine the actual variant based on state
    const actualVariant = isSelected ? 'secondary' : variant

    const button = (
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
        onMouseDown={onMouseDown}
        {...props}
      >
        {children}
      </Button>
    )

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <span>{tooltip}</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
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

// Mark button using toolbar state for proper expanded selection handling
const MarkButton = forwardRef<HTMLButtonElement, {
  markType: string;
  children: ReactNode;
  tooltip?: string;
}>(function MarkButton({ markType, children, tooltip, ...props }, ref) {
  const {
    editor,
    marks,
    textStyles,
    lists,
    alignment,
    blockquote,
    layouts,
    links,
    code,
    dividers,
    clearFormatting,
  } = useToolbarState()
  const mark = marks[markType as keyof typeof marks]

  if (!mark) return null

  return (
    <ToolbarButton
      ref={ref}
      isDisabled={mark.isDisabled}
      isSelected={mark.isSelected}
      tooltip={tooltip}
      onMouseDown={(event) => {
        event.preventDefault()
        if (mark.isSelected) {
          Editor.removeMark(editor, markType)
        } else {
          Editor.addMark(editor, markType, true)
        }
      }}
      {...props}
    >
      {children}
    </ToolbarButton>
  )
})

// Helper function to check if element is active
function isElementActive(editor: Editor, type: string) {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === type,
  })
  return !!match
}

// Helper function to get current alignment
function getCurrentAlignment(editor: Editor) {
  const [match] = Editor.nodes(editor, {
    match: n => (n as any).type === 'paragraph' || (n as any).type === 'heading',
  })
  return (match?.[0] as any)?.textAlign || 'start'
}

// Main toolbar
export function DocumentToolbar({ documentFeatures, viewState }: {
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
      <div className="sticky top-0 z-10 border-b">
        <div className="flex flex-row justify-between items-center h-10">
          <div className="flex items-center gap-2 pl-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {!!documentFeatures.formatting.headingLevels.length && (
              <div className="flex [&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*]:border [&>*]:border-input [&>*:not(:first-child)]:-ml-px">
                <HeadingMenu
                  headingLevels={documentFeatures.formatting.headingLevels}
                />
              </div>
            )}
            {hasMarks && (
              <InlineMarks marks={documentFeatures.formatting.inlineMarks} />
            )}
            {(documentFeatures.formatting.alignment.center ||
              documentFeatures.formatting.alignment.end ||
              documentFeatures.formatting.listTypes.unordered ||
              documentFeatures.formatting.listTypes.ordered) && (
              <div className="flex [&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*]:border [&>*]:border-input [&>*:not(:first-child)]:-ml-px">
                {(documentFeatures.formatting.alignment.center ||
                  documentFeatures.formatting.alignment.end) && (
                  <AlignmentMenu alignment={documentFeatures.formatting.alignment} />
                )}
                {documentFeatures.formatting.listTypes.unordered && (
                  <ListButton type="unordered-list">
                    <List size={16} />
                  </ListButton>
                )}
                {documentFeatures.formatting.listTypes.ordered && (
                  <ListButton type="ordered-list">
                    <ListOrdered size={16} />
                  </ListButton>
                )}
              </div>
            )}

            <div className="flex [&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*]:border [&>*]:border-input [&>*:not(:first-child)]:-ml-px">
              {documentFeatures.dividers && dividerButton}
              {documentFeatures.links && linkButton}
              {documentFeatures.formatting.blockTypes.blockquote &&
                blockquoteButton}
              {!!documentFeatures.layouts.length && (
                <LayoutsButton layouts={documentFeatures.layouts} />
              )}
              {documentFeatures.formatting.blockTypes.code && codeButton}
              {!!hasBlockItems && <InsertBlockMenu />}
            </div>
          </div>

          {useMemo(() => {
            const ExpandIcon = viewState?.expanded ? Minimize2 : Maximize2
            return (
              viewState && (
                <div className="border-l pl-1 pr-1">
                  <ToolbarButton
                    onMouseDown={(event) => {
                      event.preventDefault()
                      viewState.toggle()
                    }}
                    tooltip={viewState.expanded ? 'Collapse' : 'Expand'}
                  >
                    <ExpandIcon />
                  </ToolbarButton>
                </div>
              )
            )
          }, [viewState])}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Simple alignment menu using direct Slate hooks
function AlignmentMenu({ alignment }: {
  alignment: DocumentFeatures['formatting']['alignment']
}) {
  const [showMenu, setShowMenu] = useState(false)
  const editor = useSlate()

  const selected = getCurrentAlignment(editor)

  // Only disable in code blocks - same logic as bold button
  const [codeBlockEntry] = Editor.nodes(editor, {
    match: node => node.type === 'code',
  })
  const isDisabled = !!codeBlockEntry

  const alignmentIcons = {
    start: <AlignLeft size={16} />,
    center: <AlignCenter size={16} />,
    end: <AlignRight size={16} />,
  }

  return (
    <Popover open={showMenu} onOpenChange={setShowMenu}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isPressed={showMenu}
          isDisabled={isDisabled}
          className="w-auto px-2 flex items-center gap-1"
          tooltip="Text alignment"
        >
          {alignmentIcons[selected as 'start' | 'center' | 'end']}
          <ChevronDown size={16} />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="p-1 w-auto">
        <ToolbarGroup direction="column">
          {(['start', ...(Object.keys(alignment).filter(key => alignment[key as keyof typeof alignment]))] as ('start' | 'center' | 'end')[]).map(align => (
            <ToolbarButton
              key={align}
              isSelected={selected === align}
              onMouseDown={event => {
                event.preventDefault()
                if (align === 'start') {
                  Transforms.unsetNodes(editor, 'textAlign' as any, {
                    match: node => node.type === 'paragraph' || node.type === 'heading',
                  })
                } else {
                  Transforms.setNodes(editor, { textAlign: align } as any, {
                    match: node => node.type === 'paragraph' || node.type === 'heading',
                  })
                }
                setShowMenu(false)
              }}
            >
              {alignmentIcons[align]}
              <span className="ml-2 text-sm">Align {align}</span>
            </ToolbarButton>
          ))}
        </ToolbarGroup>
      </PopoverContent>
    </Popover>
  )
}

const HeadingIcon = ({ level }: { level: number }) => (
  <span className="font-semibold text-muted-foreground">
    H<sub className="text-[0.65em]">{level}</sub>
  </span>
)

function HeadingMenu({ headingLevels }: { headingLevels: DocumentFeatures['formatting']['headingLevels'] }) {
  const [showMenu, setShowMenu] = useState(false)
  const { editor, textStyles } = useToolbarState()
  const selected = textStyles.selected
  const buttonLabel = selected === 'normal' ? 'Paragraph' : `Heading ${selected}`
  const ButtonIcon = selected === 'normal' 
    ? <Pilcrow size={16} className="text-muted-foreground" />
    : <HeadingIcon level={selected as number} />
  const isDisabled = textStyles.allowedHeadingLevels.length === 0

  return (
    <Popover open={showMenu} onOpenChange={setShowMenu}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isPressed={showMenu}
          isDisabled={isDisabled}
          className="w-auto min-w-[120px] px-2 flex items-center gap-2"
          tooltip="Text style"
        >
          {ButtonIcon}
          <span className="flex-1 text-left text-sm">{buttonLabel}</span>
          <ChevronDown size={16} />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2 w-[180px]">
        <div className="flex flex-col gap-1">
          <ToolbarButton
            isSelected={selected === 'normal'}
            className="w-full justify-between px-2"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              Transforms.unwrapNodes(editor, {
                match: (n) => n.type === 'heading',
              })
              setShowMenu(false)
            }}
          >
            <span className="flex items-center gap-2">
              <Pilcrow size={16} className="text-muted-foreground" />
              <span className="text-sm">Paragraph</span>
            </span>
            {selected === 'normal' && <Check size={16} />}
          </ToolbarButton>
          {headingLevels.map((hNum: any) => {
            const isSelected = selected === hNum
            return (
              <ToolbarButton
                key={hNum}
                isSelected={isSelected}
                className="w-full justify-between px-2"
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (isSelected) {
                    Transforms.unwrapNodes(editor, {
                      match: (n) => n.type === 'heading',
                    })
                  } else {
                    Transforms.setNodes(
                      editor,
                      { type: 'heading', level: hNum },
                      {
                        match: (node) =>
                          node.type === 'paragraph' || node.type === 'heading',
                      }
                    )
                  }
                  setShowMenu(false)
                }}
              >
                <span className="flex items-center gap-2">
                  <HeadingIcon level={hNum} />
                  <span className="text-sm">Heading {hNum}</span>
                </span>
                {isSelected && <Check size={16} />}
              </ToolbarButton>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function InlineMarks({ marks }: { marks: DocumentFeatures['formatting']['inlineMarks'] }) {
  return (
    <div className="flex [&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*]:border [&>*]:border-input [&>*:not(:first-child)]:-ml-px">
      {marks.bold && (
        <MarkButton markType="bold" tooltip={`${modifierKeyText}+B`}>
          <Bold className="stroke-[3]" size={16} />
        </MarkButton>
      )}
      {marks.italic && (
        <MarkButton markType="italic" tooltip={`${modifierKeyText}+I`}>
          <Italic size={16} />
        </MarkButton>
      )}
      {marks.underline && (
        <MarkButton markType="underline" tooltip={`${modifierKeyText}+U`}>
          <span className="underline">U</span>
        </MarkButton>
      )}
      {marks.strikethrough && (
        <MarkButton markType="strikethrough" tooltip="Strikethrough">
          <span className="line-through">S</span>
        </MarkButton>
      )}
      {marks.code && (
        <MarkButton markType="code" tooltip="Code">
          <span className="font-mono text-xs">{`</>`}</span>
        </MarkButton>
      )}
    </div>
  )
}

function InsertBlockMenu() {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <Popover open={showMenu} onOpenChange={setShowMenu}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isPressed={showMenu}
          tooltip="Insert"
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
  )
}