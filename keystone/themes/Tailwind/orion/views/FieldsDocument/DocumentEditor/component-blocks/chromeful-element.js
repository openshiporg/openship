
import { Trash2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@ui/tooltip"
import { useMemo, useState, useCallback, Fragment } from "react"
import { useSelected } from "slate-react"
import { ToolbarGroup, ToolbarButton, ToolbarSeparator } from "../primitives"
import { NotEditable } from "./api"
import { clientSideValidateProp } from "./utils"
import { FormValueContentFromPreviewProps } from "./form-from-preview"

export function ChromefulComponentBlockElement(props) {
  const selected = useSelected()

  const isValid = useMemo(
    () =>
      clientSideValidateProp(
        { kind: "object", fields: props.componentBlock.schema },
        props.elementProps
      ),
    [props.componentBlock, props.elementProps]
  )

  const [editMode, setEditMode] = useState(false)
  const onCloseEditMode = useCallback(() => {
    setEditMode(false)
  }, [])
  const onShowEditMode = useCallback(() => {
    setEditMode(true)
  }, [])

  const ChromefulToolbar =
    props.componentBlock.toolbar ?? DefaultToolbarWithChrome
  return (
    <div
      {...props.attributes}
      className={`relative my-8 pl-8 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded before:z-[1] ${
        selected 
          ? 'before:bg-primary' 
          : editMode 
            ? 'before:bg-blue-500' 
            : 'before:bg-border'
      }`}
    >
      <NotEditable
        className="block text-muted-foreground text-xs font-semibold uppercase leading-none mb-2"
      >
        {props.componentBlock.label}
      </NotEditable>
      {editMode ? (
        <Fragment>
          <FormValue
            isValid={isValid}
            props={props.previewProps}
            onClose={onCloseEditMode}
          />
          <div className="hidden">{props.children}</div>
        </Fragment>
      ) : (
        <Fragment>
          {props.renderedBlock}
          <ChromefulToolbar
            isValid={isValid}
            onRemove={props.onRemove}
            onShowEditMode={onShowEditMode}
            props={props.previewProps}
          />
        </Fragment>
      )}
    </div>
  )
}

function DefaultToolbarWithChrome({ onShowEditMode, onRemove, isValid }) {
  return (
    <ToolbarGroup as={NotEditable} className="mt-2">
      <ToolbarButton
        onClick={() => {
          onShowEditMode()
        }}
      >
        Edit
      </ToolbarButton>
      <ToolbarSeparator />
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolbarButton
            variant="destructive"
            onClick={() => {
              onRemove()
            }}
          >
            <Trash2 size={16} />
          </ToolbarButton>
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>
      {!isValid && (
        <Fragment>
          <ToolbarSeparator />
          <span className="text-destructive flex items-center pl-2">
            Please edit the form, there are invalid fields.
          </span>
        </Fragment>
      )}
    </ToolbarGroup>
  )
}

function FormValue({ onClose, props, isValid }) {
  const [forceValidation, setForceValidation] = useState(false)

  return (
    <div className="flex flex-col gap-8" contentEditable={false}>
      <FormValueContentFromPreviewProps
        {...props}
        forceValidation={forceValidation}
      />
      <button
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-fit"
        onClick={() => {
          if (isValid) {
            onClose()
          } else {
            setForceValidation(true)
          }
        }}
      >
        Done
      </button>
    </div>
  )
}
