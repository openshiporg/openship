import React, { type ReactNode, useContext } from 'react'
import { useSlate } from 'slate-react'
import { type DocumentFeatures } from '../../index'
import { ComponentBlockContext } from './component-blocks'
import { type ComponentBlock } from './component-blocks/api'
import { LayoutOptionsProvider } from './layouts'
import { DocumentFieldRelationshipsProvider, type Relationships } from './relationship'

import { type ToolbarState, createToolbarState } from './toolbar-state-shared'

const ToolbarStateContext = React.createContext<null | ToolbarState>(null)

// Default empty document features for fallback
const defaultDocumentFeatures: DocumentFeatures = {
  formatting: {
    inlineMarks: {
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
      code: true,
      superscript: false,
      subscript: false,
      keyboard: false,
    },
    listTypes: { ordered: true, unordered: true },
    alignment: { center: true, end: true },
    headingLevels: [1, 2, 3, 4, 5, 6],
    blockTypes: { blockquote: true, code: true },
    softBreaks: true,
  },
  links: true,
  dividers: true,
  layouts: [],
}

export function useToolbarState(): ToolbarState {
  const toolbarState = useContext(ToolbarStateContext)
  const editor = useSlate()
  
  // If we have context, use it. Otherwise create toolbar state directly.
  // This avoids conditional hook calls - we always call useSlate() above.
  if (toolbarState) {
    return toolbarState
  }
  
  // Create a default toolbar state when no provider is present
  return createToolbarState(editor, {}, defaultDocumentFeatures)
}

export const ToolbarStateProvider = ({
  children,
  componentBlocks,
  editorDocumentFeatures,
  relationships,
}: {
  children: ReactNode
  componentBlocks: Record<string, ComponentBlock>
  editorDocumentFeatures: DocumentFeatures
  relationships: Relationships
}) => {
  const editor = useSlate()

  return (
    <DocumentFieldRelationshipsProvider value={relationships}>
      <LayoutOptionsProvider value={editorDocumentFeatures.layouts}>
        <ComponentBlockContext.Provider value={componentBlocks}>
          <ToolbarStateContext.Provider
            value={createToolbarState(editor, componentBlocks, editorDocumentFeatures)}
          >
            {children}
          </ToolbarStateContext.Provider>
        </ComponentBlockContext.Provider>
      </LayoutOptionsProvider>
    </DocumentFieldRelationshipsProvider>
  )
}
