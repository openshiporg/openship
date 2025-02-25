import React, { Fragment, useMemo } from "react"
import { Minus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@ui/tooltip"
import { useToolbarState } from "./toolbar-state"
import { insertDivider } from "./divider-shared"
import { ToolbarButton, TooltipWithShortcut } from "./Toolbar"

function DividerButton() {
  const {
    editor,
    dividers: { isDisabled }
  } = useToolbarState()
  
  return (
    <ToolbarButton
      isDisabled={isDisabled}
      onMouseDown={event => {
        event.preventDefault()
        insertDivider(editor)
      }}
    >
      <Minus size={16} />
    </ToolbarButton>
  )
}

export const dividerButton = (
  <Tooltip>
    <TooltipTrigger>
      <DividerButton />
    </TooltipTrigger>
    <TooltipWithShortcut shortcut="---">Divider</TooltipWithShortcut>
  </Tooltip>
)
