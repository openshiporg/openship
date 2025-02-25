/** @jsxRuntime classic */
/** @jsx jsx */
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Editor, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { matchSorter } from 'match-sorter'
import scrollIntoView from 'scroll-into-view-if-needed'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ui/popover'
import { ComponentBlockContext, insertComponentBlock } from './component-blocks'
import { ToolbarGroup, ToolbarButton } from './primitives'
import { useDocumentFieldRelationships } from './relationship'
import { useToolbarState } from './toolbar-state'
import { insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading } from './utils'
import { insertLayout } from './layouts-shared'

export * from './insert-menu-shared'

function noop() {}

function getOptions(toolbarState, componentBlocks, relationships) {
  const options = [
    ...Object.entries(relationships).map(([relationship, { label }]) => ({
      label,
      insert: (editor) => {
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
      insert: (editor) => {
        insertComponentBlock(editor, componentBlocks, key)
      },
    })),
    ...toolbarState.textStyles.allowedHeadingLevels
      .filter(a => toolbarState.editorDocumentFeatures.formatting.headingLevels.includes(a))
      .map(level => ({
        label: `Heading ${level}`,
        insert(editor) {
          insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
            type: 'heading',
            level,
            children: [{ text: '' }],
          })
        },
      })),
    !toolbarState.blockquote.isDisabled &&
      toolbarState.editorDocumentFeatures.formatting.blockTypes.blockquote && {
        label: 'Blockquote',
        insert(editor) {
          insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
            type: 'blockquote',
            children: [{ text: '' }],
          })
        },
      },
    !toolbarState.code.isDisabled &&
      toolbarState.editorDocumentFeatures.formatting.blockTypes.code && {
        label: 'Code block',
        insert(editor) {
          insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
            type: 'code',
            children: [{ text: '' }],
          })
        },
      },
    !toolbarState.dividers.isDisabled &&
      toolbarState.editorDocumentFeatures.dividers && {
        label: 'Divider',
        insert(editor) {
          insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
            type: 'divider',
            children: [{ text: '' }],
          })
        },
      },
    !!toolbarState.editorDocumentFeatures.layouts.length && {
      label: 'Layout',
      insert(editor) {
        insertLayout(editor, toolbarState.editorDocumentFeatures.layouts[0])
      },
    },
    !toolbarState.lists.ordered.isDisabled &&
      toolbarState.editorDocumentFeatures.formatting.listTypes.ordered && {
        label: 'Numbered List',
        keywords: ['ordered list'],
        insert(editor) {
          insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
            type: 'ordered-list',
            children: [{ text: '' }],
          })
        },
      },
    !toolbarState.lists.unordered.isDisabled &&
      toolbarState.editorDocumentFeatures.formatting.listTypes.unordered && {
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
  return options.filter(x => typeof x !== 'boolean')
}

function insertOption(editor, text, option) {
  const path = ReactEditor.findPath(editor, text)
  Transforms.delete(editor, {
    at: {
      focus: Editor.start(editor, path),
      anchor: Editor.end(editor, path),
    },
  })
  option.insert(editor)
}

export function InsertMenu({ children, text }) {
  const toolbarState = useToolbarState()
  const {
    editor,
    relationships: { isDisabled: relationshipsDisabled },
  } = toolbarState
  const componentBlocks = useContext(ComponentBlockContext)
  const relationships = useDocumentFieldRelationships()
  const options = matchSorter(
    getOptions(toolbarState, componentBlocks, relationshipsDisabled ? {} : relationships),
    text.text.slice(1),
    {
      keys: ['label', 'keywords'],
    }
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  if (options.length && selectedIndex >= options.length) {
    setSelectedIndex(0)
  }

  const stateRef = useRef({ selectedIndex, options, text })

  useEffect(() => {
    stateRef.current = { selectedIndex, options, text }
  })

  const dialogRef = useRef(null)

  useEffect(() => {
    const element = dialogRef.current?.children?.[selectedIndex]
    if (dialogRef.current && element) {
      scrollIntoView(element, {
        scrollMode: 'if-needed',
        boundary: dialogRef.current,
        block: 'nearest',
      })
    }
  }, [selectedIndex])

  useEffect(() => {
    const domNode = ReactEditor.toDOMNode(editor, editor)
    const listener = (event) => {
      if (event.defaultPrevented) return
      switch (event.key) {
        case 'ArrowDown': {
          if (stateRef.current.options.length) {
            event.preventDefault()
            setSelectedIndex(
              stateRef.current.selectedIndex === stateRef.current.options.length - 1
                ? 0
                : stateRef.current.selectedIndex + 1
            )
          }
          return
        }
        case 'ArrowUp': {
          if (stateRef.current.options.length) {
            event.preventDefault()
            setSelectedIndex(
              stateRef.current.selectedIndex === 0
                ? stateRef.current.options.length - 1
                : stateRef.current.selectedIndex - 1
            )
          }
          return
        }
        case 'Enter': {
          const option = stateRef.current.options[stateRef.current.selectedIndex]
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
    domNode.addEventListener('keydown', listener)
    return () => {
      domNode.removeEventListener('keydown', listener)
    }
  }, [editor])

  return (
    <Fragment>
      <Popover open={true}>
        <PopoverTrigger asChild>
          <span className="text-blue-500">
            {children}
          </span>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          sideOffset={4} 
          className={`${options.length ? '' : 'hidden'} max-h-[300px] z-[3] select-none p-1`}
        >
          <div
            ref={dialogRef}
            className="overflow-y-auto max-h-[284px]"
          >
            {options.map((option, index) => (
              <ToolbarButton
                key={option.label}
                isPressed={index === selectedIndex}
                onMouseEnter={() => {
                  setSelectedIndex(index)
                }}
                onMouseDown={event => {
                  event.preventDefault()
                  insertOption(editor, text, option)
                }}>
                {option.label}
              </ToolbarButton>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </Fragment>
  )
}
