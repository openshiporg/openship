import React, { useContext } from "react"
import { useSlate } from "slate-react"
import { ComponentBlockContext } from "./component-blocks"
import { LayoutOptionsProvider } from "./layouts"
import { DocumentFieldRelationshipsProvider } from "./relationship"

import { createToolbarState } from "./toolbar-state-shared"

const ToolbarStateContext = React.createContext(null)

export function useToolbarState() {
  const toolbarState = useContext(ToolbarStateContext)
  if (!toolbarState) {
    throw new Error("ToolbarStateProvider must be used to use useToolbarState")
  }
  return toolbarState
}

export const ToolbarStateProvider = ({
  children,
  componentBlocks,
  editorDocumentFeatures,
  relationships
}) => {
  const editor = useSlate()

  return (
    <DocumentFieldRelationshipsProvider value={relationships}>
      <LayoutOptionsProvider value={editorDocumentFeatures.layouts}>
        <ComponentBlockContext.Provider value={componentBlocks}>
          <ToolbarStateContext.Provider
            value={createToolbarState(
              editor,
              componentBlocks,
              editorDocumentFeatures
            )}
          >
            {children}
          </ToolbarStateContext.Provider>
        </ComponentBlockContext.Provider>
      </LayoutOptionsProvider>
    </DocumentFieldRelationshipsProvider>
  )
}
