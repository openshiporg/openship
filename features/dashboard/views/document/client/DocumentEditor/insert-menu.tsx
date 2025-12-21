import { type ReactNode, Fragment, useContext, useEffect, useRef } from 'react'
import { type Text, Editor, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { matchSorter } from 'match-sorter'
import scrollIntoView from 'scroll-into-view-if-needed'
import { ComponentBlockContext, insertComponentBlock } from './component-blocks'
import { type ComponentBlock } from './component-blocks/api-shared'
import { type Relationships } from './relationship-shared'
import { useDocumentFieldRelationships } from './relationship'
import { useSlate } from 'slate-react'
import { insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading } from './utils'
import { insertLayout } from './layouts-shared'

import { useOverlayTrigger } from '@react-aria/overlays'
// import { useListState } from '@react-stately/list'
import { useOverlayTriggerState } from '@react-stately/overlays'
import { Popover as ShadPopover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils' // Assuming cn utility is available

export * from './insert-menu-shared'

type Option = {
  label: string
  keywords?: string[]
  insert: (editor: Editor) => void
}

function getOptions(
  editor: Editor,
  editorDocumentFeatures: any,
  componentBlocks: Record<string, ComponentBlock>,
  relationships: Relationships
): Option[] {
  const codeBlockEntry = Editor.nodes(editor, { match: node => node.type === 'code' }).next().value
  const isInCodeBlock = !!codeBlockEntry
  const headingEntry = Editor.nodes(editor, { match: node => node.type === 'heading' }).next().value
  const isInHeading = !!headingEntry

  const options: (Option | boolean)[] = [
    ...Object.entries(relationships).map(([relationship, { label }]) => ({
      label,
      insert: (editor: Editor) => {
        Transforms.insertNodes(editor, {
          type: 'relationship',
          relationship,
          data: null,
          children: [{ text: '' }],
        })
      },
    })),
    ...Object.keys(componentBlocks).map(key => ({
      label: componentBlocks[key].label,
      insert: (editor: Editor) => {
        insertComponentBlock(editor, componentBlocks, key)
      },
    })),
    ...(isInCodeBlock ? [] : editorDocumentFeatures.formatting.headingLevels.map((level: any) => ({
      label: `Heading ${level}`,
      insert(editor: Editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'heading',
          level,
          children: [{ text: '' }],
        })
      },
    }))),
    !isInCodeBlock && editorDocumentFeatures.formatting.blockTypes.blockquote && {
      label: 'Blockquote',
      insert(editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'blockquote',
          children: [{ text: '' }],
        })
      },
    },
    !isInCodeBlock && editorDocumentFeatures.formatting.blockTypes.code && {
      label: 'Code block',
      insert(editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'code',
          children: [{ text: '' }],
        })
      },
    },
    !isInCodeBlock && editorDocumentFeatures.dividers && {
      label: 'Divider',
      insert(editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'divider',
          children: [{ text: '' }],
        })
      },
    },
    !!editorDocumentFeatures.layouts.length && {
      label: 'Layout',
      insert(editor) {
        insertLayout(editor, editorDocumentFeatures.layouts[0])
      },
    },
    !isInCodeBlock && !isInHeading && editorDocumentFeatures.formatting.listTypes.ordered && {
      label: 'Numbered List',
      keywords: ['ordered list'],
      insert(editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'ordered-list',
          children: [{ text: '' }],
        })
      },
    },
    !isInCodeBlock && !isInHeading && editorDocumentFeatures.formatting.listTypes.unordered && {
      label: 'Bullet List',
      keywords: ['unordered list'],
      insert(editor) {
        insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
          type: 'unordered-list',
          children: [{ text: '' }],
        })
      },
    },
  ]
  return options.filter((x): x is Exclude<typeof x, boolean> => typeof x !== 'boolean')
}

function insertOption(editor: Editor, text: Text, option: Option) {
  try {
    // Safety check for text node
    if (!text || typeof text.text !== 'string') {
      console.warn('Invalid text node in insertOption:', text)
      return
    }

    const path = ReactEditor.findPath(editor, text)
    Transforms.delete(editor, {
      at: {
        focus: Editor.start(editor, path),
        anchor: Editor.end(editor, path),
      },
    })
    option.insert(editor)
  } catch (error) {
    console.error('Error in insertOption:', error, { text, option })
  }
}

export function InsertMenu({ children, text }: { children: ReactNode; text: Text }) {
  // Safety check for text node
  if (!text || typeof text.text !== 'string') {
    console.warn('InsertMenu received invalid text node:', text)
    return <>{children}</>
  }

  // Safety check for children
  if (children === undefined || children === null) {
    console.warn('InsertMenu received invalid children:', children)
    return <span>{text.text}</span>
  }

  const editor = useSlate()
  const componentBlocks = useContext(ComponentBlockContext)
  const relationships = useDocumentFieldRelationships()

  // For now, use default document features - this can be refined later
  const editorDocumentFeatures = {
    formatting: {
      headingLevels: [1, 2, 3, 4, 5, 6],
      blockTypes: {
        blockquote: true,
        code: true
      },
      listTypes: {
        ordered: true,
        unordered: true
      },
      alignment: {
        center: true,
        end: true
      }
    },
    dividers: true,
    layouts: []
  }

  const options = matchSorter(
    getOptions(editor, editorDocumentFeatures, componentBlocks, relationships),
    text.text.slice(1),
    {
      keys: ['label', 'keywords'],
    }
  ).map((option, index) => ({ ...option, index }))

  const stateRef = useRef({ options, text })

  useEffect(() => {
    stateRef.current = { options, text }
  })

  const listenerRef = useRef((_event: KeyboardEvent) => {})
  useEffect(() => {
    listenerRef.current = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      switch (event.key) {
        case 'ArrowDown': {
          if (stateRef.current.options.length) {
            event.preventDefault()
            // TODO: Fix state management
            // state.selectionManager.setFocused(true)
            // state.selectionManager.setFocusedKey(
            //   (Number(state.selectionManager.focusedKey) === stateRef.current.options.length - 1
            //     ? 0
            //     : Number(state.selectionManager.focusedKey) + 1
            //   ).toString()
            // )
          }
          return
        }
        case 'ArrowUp': {
          if (stateRef.current.options.length) {
            event.preventDefault()
            // TODO: Fix state management
            // state.selectionManager.setFocused(true)
            // state.selectionManager.setFocusedKey(
            //   (state.selectionManager.focusedKey === '0'
            //     ? stateRef.current.options.length - 1
            //     : Number(state.selectionManager.focusedKey) - 1
            //   ).toString()
            // )
          }
          return
        }
        case 'Enter': {
          const option = stateRef.current.options[0] // TODO: Fix state management
          if (option) {
            insertOption(editor, stateRef.current.text, option)
            event.preventDefault()
          }
          return
        }
        case 'Escape': {
          const path = ReactEditor.findPath(editor, stateRef.current.text)
          Transforms.unsetNodes(editor, 'insertMenu', { at: path })
          event.preventDefault()
          return
        }
      }
    }
  })

  useEffect(() => {
    const domNode = ReactEditor.toDOMNode(editor, editor)
    let listener = (event: KeyboardEvent) => listenerRef.current(event)
    domNode.addEventListener('keydown', listener)
    return () => {
      domNode.removeEventListener('keydown', listener)
    }
  }, [editor])
  const triggerRef = useRef<HTMLSpanElement>(null)
  const overlayState = useOverlayTriggerState({ isOpen: true })
  const {
    triggerProps: { onPress, ...triggerProps },
    overlayProps,
  } = useOverlayTrigger({ type: 'listbox' }, overlayState, triggerRef)
  // useListState and ListBoxBase are replaced by Command components

  // TODO: Fix state management
  // useEffect(() => {
  //   if (!state.selectionManager.isFocused && state.collection.size) {
  //     state.selectionManager.setFocused(true)
  //     state.selectionManager.setFocusedKey('0')
  //   }
  // }, [state])
  const scrollableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scrollableRef.current?.querySelector('[role="listbox"] [role="presentation"]')
      ?.children[0] // TODO: Fix state management
    if (element) {
      scrollIntoView(element, {
        scrollMode: 'if-needed',
        boundary: scrollableRef.current,
        block: 'nearest',
      })
    }
  }, []) // TODO: Fix state management
  const listboxRef = useRef(null) // May not be needed with Command
  // let layout = useListBoxLayout() // Not needed with Command

  return (
    <ShadPopover open={overlayState.isOpen} onOpenChange={(open) => { if(!open) overlayState.close() }}>
      <PopoverTrigger asChild>
        <span
          {...triggerProps}
          role="button"
          className="text-accent-foreground font-medium" // Replaced css
          ref={triggerRef}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--ks-alias-single-line-width,300px)] p-0" // Replaced width, Popover manages placement
        side="bottom"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // To prevent focus stealing from editor
        // ref={overlayProps.ref} // TODO: Fix ref type
        {...overlayProps} // Spread other overlayProps
      >
        <Command ref={listboxRef}>
          {/* CommandInput could be added here if live filtering of the already filtered `options` is desired */}
          {/* <CommandInput placeholder="Type a command or search..." /> */}
          <CommandList ref={scrollableRef} className="max-h-[300px] overflow-y-auto">
            {options.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.index}
                  value={option.label} // Value for Command filtering/selection
                  onSelect={() => {
                    insertOption(editor, text, option)
                    overlayState.close() // Close popover on select
                  }}
                  className={cn(
                    false && "bg-accent text-accent-foreground" // TODO: Fix state management
                  )}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </ShadPopover>
  )
}
