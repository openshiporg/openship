import React, { Fragment, useMemo } from "react"
import { Minus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { useToolbarState } from "./toolbar-state"
import { insertDivider } from "./divider-shared"
import { ToolbarButton, KeyboardInTooltip } from "./Toolbar"

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
    <TooltipTrigger asChild>
      <DividerButton />
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <span className="flex items-center gap-2">
        <span>Divider</span>
        <KeyboardInTooltip>---</KeyboardInTooltip>
      </span>
    </TooltipContent>
  </Tooltip>
)