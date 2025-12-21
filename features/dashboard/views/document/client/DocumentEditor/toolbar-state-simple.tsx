import React, { useContext } from 'react'
import { useSlate, useSlateSelection } from 'slate-react'
import { Editor } from 'slate'
import { type DocumentFeatures } from '../../index'
import { type ComponentBlock } from './component-blocks/api'
import { type Relationships } from './relationship'

// Simple toolbar state for compatibility during migration
export type SimpleToolbarState = {
  editor: any
  marks: {
    bold: { isSelected: boolean; isDisabled: boolean }
    italic: { isSelected: boolean; isDisabled: boolean }
    underline: { isSelected: boolean; isDisabled: boolean }
    strikethrough: { isSelected: boolean; isDisabled: boolean }
    code: { isSelected: boolean; isDisabled: boolean }
  }
  lists: {
    ordered: { isSelected: boolean; isDisabled: boolean }
    unordered: { isSelected: boolean; isDisabled: boolean }
  }
  alignment: {
    selected: 'start' | 'center' | 'end'
    isDisabled: boolean
  }
  textStyles: {
    selected: 'normal' | 1 | 2 | 3 | 4 | 5 | 6
    allowedHeadingLevels: (1 | 2 | 3 | 4 | 5 | 6)[]
  }
  blockquote: { isSelected: boolean; isDisabled: boolean }
  links: { isSelected: boolean; isDisabled: boolean }
  code: { isSelected: boolean; isDisabled: boolean }
  dividers: { isDisabled: boolean }
  relationships: { isDisabled: boolean }
  clearFormatting: { isDisabled: boolean }
  layouts: { isSelected: boolean }
}

const SimpleToolbarStateContext = React.createContext<SimpleToolbarState | null>(null)

export function useToolbarState(): SimpleToolbarState {
  const toolbarState = useContext(SimpleToolbarStateContext)
  // Always call useSlate - don't conditionally call hooks
  const editor = useSlate()
  useSlateSelection()
  
  if (toolbarState) {
    return toolbarState
  }
  
  // Provide a fallback instead of throwing an error
  return createSimpleToolbarState(editor)
}

function createSimpleToolbarState(editor: any): SimpleToolbarState {
  // Get current marks
  const marks = Editor.marks(editor) || {}

  // Check if in code block
  const [codeBlockEntry] = Editor.nodes(editor, {
    match: node => node.type === 'code',
  })
  const inCodeBlock = !!codeBlockEntry

  // Check if in heading
  const [headingEntry] = Editor.nodes(editor, {
    match: node => node.type === 'heading',
  })

  // Check list states
  const [orderedListEntry] = Editor.nodes(editor, {
    match: node => node.type === 'ordered-list',
  })
  const [unorderedListEntry] = Editor.nodes(editor, {
    match: node => node.type === 'unordered-list',
  })

  // Check alignment
  const [alignableEntry] = Editor.nodes(editor, {
    match: node => (node.type === 'paragraph' || node.type === 'heading'),
  })
  const currentAlignment = alignableEntry?.[0]?.textAlign || 'start'

  return {
    editor,
    marks: {
      bold: { isSelected: !!marks.bold, isDisabled: inCodeBlock },
      italic: { isSelected: !!marks.italic, isDisabled: inCodeBlock },
      underline: { isSelected: !!marks.underline, isDisabled: inCodeBlock },
      strikethrough: { isSelected: !!marks.strikethrough, isDisabled: inCodeBlock },
      code: { isSelected: !!marks.code, isDisabled: inCodeBlock },
    },
    lists: {
      ordered: { isSelected: !!orderedListEntry, isDisabled: !!headingEntry },
      unordered: { isSelected: !!unorderedListEntry, isDisabled: !!headingEntry },
    },
    alignment: {
      selected: currentAlignment as 'start' | 'center' | 'end',
      isDisabled: !alignableEntry,
    },
    textStyles: {
      selected: headingEntry?.[0]?.level || 'normal',
      allowedHeadingLevels: [1, 2, 3, 4, 5, 6], // Simplified - enable all
    },
    blockquote: {
      isSelected: !!Editor.nodes(editor, { match: node => node.type === 'blockquote' }).next().value,
      isDisabled: inCodeBlock
    },
    links: {
      isSelected: !!Editor.nodes(editor, { match: node => node.type === 'link' }).next().value,
      isDisabled: inCodeBlock
    },
    code: {
      isSelected: !!Editor.nodes(editor, { match: node => node.type === 'code' }).next().value,
      isDisabled: false
    },
    dividers: { isDisabled: false },
    relationships: { isDisabled: false },
    clearFormatting: { isDisabled: false },
    layouts: { isSelected: !!Editor.nodes(editor, { match: node => node.type === 'layout' }).next().value },
  }
}