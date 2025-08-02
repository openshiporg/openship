import {
  type ReactNode,
  useMemo,
  useState,
  useCallback,
  Fragment,
  forwardRef,
  type PropsWithChildren,
  type Ref,
  useId,
} from 'react'
import { type RenderElementProps, useSelected } from 'slate-react'
import { Button } from '@/components/ui/button'
import { Dialog as ShadDialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { TooltipProvider, Tooltip as ShadTooltip, TooltipTrigger as ShadTooltipTrigger, TooltipContent as ShadTooltipContent } from '@/components/ui/tooltip'
import { Trash2 } from 'lucide-react'

import {
  type PreviewPropsForToolbar,
  type ObjectField,
  type ComponentSchema,
  type ComponentBlock,
  NotEditable,
} from './api'
import { clientSideValidateProp } from './utils'
import type { GenericPreviewProps } from './api'
import {
  FormValueContentFromPreviewProps,
  previewPropsOnChange,
  previewPropsToValue,
} from './form-from-preview'
import { blockElementSpacing } from '../utils-hooks'
import { createGetPreviewProps } from './preview-props'

export function ChromefulComponentBlockElement(props: {
  children: ReactNode
  renderedBlock: ReactNode
  componentBlock: ComponentBlock & { chromeless?: false }
  previewProps: PreviewPropsForToolbar<ObjectField<Record<string, ComponentSchema>>>
  elementProps: Record<string, unknown>
  onRemove: () => void
  attributes: RenderElementProps['attributes']
}) {
  const selected = useSelected()

  const isValid = useMemo(
    () =>
      clientSideValidateProp(
        { kind: 'object', fields: props.componentBlock.schema },
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

  const ChromefulToolbar = props.componentBlock.toolbar ?? DefaultToolbarWithChrome
  return (
    <BlockPrimitive selected={selected} {...props.attributes}>
      <div className="flex flex-col gap-3"> {/* Replaced Flex */}
        <NotEditable>
          {/* Replaced Text */}
          <p className="uppercase text-xs font-medium text-neutral-500">
            {props.componentBlock.label}
          </p>
        </NotEditable>
        <Fragment>
          {props.renderedBlock}
          <ChromefulToolbar
            isValid={isValid}
            onRemove={props.onRemove}
            props={props.previewProps}
            onShowEditMode={onShowEditMode}
          />
          {editMode && (
            <ShadDialog open={editMode} onOpenChange={(open) => !open && onCloseEditMode()}>
              <DialogContent>
                <DialogHeader>
                  {/* Replaced Heading */}
                  <DialogTitle>Edit {props.componentBlock.label}</DialogTitle>
                </DialogHeader>
                <FormValue props={props.previewProps} onClose={onCloseEditMode} />
              </DialogContent>
            </ShadDialog>
          )}
        </Fragment>
      </div>
    </BlockPrimitive>
  )
}

/**
 * Wrap block content, delimiting it from surrounding content, and provide a
 * focus indicator because the cursor may not be present.
 */
const BlockPrimitive = forwardRef(function BlockPrimitive(
  {
    children,
    selected,
    ...attributes
  }: PropsWithChildren<Omit<RenderElementProps['attributes'], 'ref'> & { selected: boolean }>,
  ref: Ref<any>
) {
  return (
    <div
      {...attributes}
      ref={ref}
      className={`relative pl-6 mb-6 ${blockElementSpacing}`} // Replaced css and tokenSchema
    >
      <span
        className={`block absolute left-0 top-0 bottom-0 z-10 w-1 rounded-sm ${selected ? 'bg-blue-500' : 'bg-neutral-300'}`} // Replaced ::before with a span and Tailwind
        aria-hidden="true"
      />
      {children}
    </div>
  )
})

function DefaultToolbarWithChrome({
  onShowEditMode,
  onRemove,
  isValid,
}: {
  onShowEditMode(): void
  onRemove(): void
  props: any
  isValid: boolean
}) {
  return (
    <NotEditable>
      <div className="flex flex-col gap-3"> {/* Replaced Flex */}
        <div className="flex items-center gap-2 select-none"> {/* Replaced Flex */}
          <Button variant="outline" size="sm" onClick={() => onShowEditMode()}>Edit</Button>
          <TooltipProvider>
            <ShadTooltip>
              <ShadTooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRemove}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ShadTooltipTrigger>
              <ShadTooltipContent side="bottom">
                <p>Delete</p>
              </ShadTooltipContent>
            </ShadTooltip>
          </TooltipProvider>
        </div>
        {/* Replaced FieldMessage */}
        {!isValid && <p className="text-sm text-red-600">Contains invalid fields. Please edit.</p>}
      </div>
    </NotEditable>
  )
}

function FormValue({
  onClose,
  props,
}: {
  props: GenericPreviewProps<ComponentSchema, unknown>
  onClose(): void
}) {
  const formId = useId()
  const [forceValidation, setForceValidation] = useState(false)
  const [state, setState] = useState(() => previewPropsToValue(props))
  const previewProps = useMemo(
    () => createGetPreviewProps(props.schema, setState, () => undefined),
    [props.schema]
  )(state)

  return (
    <>
      {/* Content is part of DialogContent in ShadCN */}
      <form
        id={formId}
        onSubmit={event => {
          if (event.target !== event.currentTarget) return
          event.preventDefault()
          if (!clientSideValidateProp(props.schema, state)) {
            setForceValidation(true)
          } else {
            previewPropsOnChange(state, props)
            onClose()
          }
        }}
        className="flex flex-col gap-6" // Replaced Flex
      >
        <FormValueContentFromPreviewProps {...previewProps} forceValidation={forceValidation} />
      </form>
      <DialogFooter> {/* Replaced ButtonGroup */}
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button form={formId} type="submit">
          Done
        </Button>
      </DialogFooter>
    </>
  )
}
