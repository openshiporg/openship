/** @jsxRuntime classic */
/** @jsx jsx */
import { useList } from '@keystone-6/core/admin-ui/context'
import { RelationshipSelect } from '@keystone-6/core/fields/types/relationship/views/RelationshipSelect'
import { Button } from '@ui/button'
import { PlusCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@ui/alert-dialog'
import { memo, useCallback, useMemo, useState } from 'react'
import { DragHandle, OrderableItem, OrderableList, RemoveButton } from '../primitives/orderable'
import { previewPropsToValue, setValueToPreviewProps } from './get-value'
import { createGetPreviewProps } from './preview-props'
import { assertNever, clientSideValidateProp } from './utils'

function ArrayFieldPreview(props) {
  return (
    <div className="flex flex-col gap-4">
      {props.schema.label && <div className="text-sm font-medium">{props.schema.label}</div>}
      <OrderableList {...props}>
        {props.elements.map(val => {
          return (
            <OrderableItemInForm
              elementKey={val.key}
              label={props.schema.itemLabel?.(val) ?? 'Item'}
              {...val} />
          )
        })}
      </OrderableList>
      <Button
        autoFocus={props.autoFocus}
        onClick={() => {
          props.onChange([...props.elements.map(x => ({ key: x.key })), { key: undefined }])
        }}
        variant="outline"
        className="gap-2"
      >
        <PlusCircle size={16} /> <span>Add</span>
      </Button>
    </div>
  )
}

function RelationshipFieldPreview({
  schema,
  autoFocus,
  onChange,
  value
}) {
  const list = useList(schema.listKey)
  const searchFields = Object.keys(list.fields).filter(key => list.fields[key].search)

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{schema.label}</div>
      <RelationshipSelect
        autoFocus={autoFocus}
        controlShouldRenderValue
        isDisabled={false}
        list={list}
        labelField={list.labelField}
        searchFields={searchFields}
        extraSelection={schema.selection || ''}
        portalMenu
        state={
          schema.many
            ? {
                kind: 'many',
                value: (value).map(x => ({
                  id: x.id,
                  label: x.label || x.id,
                  data: x.data,
                })),
                onChange: onChange,
              }
            : {
                kind: 'one',
                value: value
                  ? {
                      ...(value),
                      label: (value).label || (value).id,
                    }
                  : null,
                onChange: onChange,
              }
        } />
    </div>
  )
}

function FormFieldPreview({
  schema,
  autoFocus,
  forceValidation,
  onChange,
  value
}) {
  return (
    <schema.Input
      autoFocus={!!autoFocus}
      value={value}
      onChange={onChange}
      forceValidation={!!forceValidation} />
  )
}

function ObjectFieldPreview({
  schema,
  autoFocus,
  fields
}) {
  const firstFocusable = autoFocus ? findFocusableObjectFieldKey(schema) : undefined
  return (
    <div className="flex flex-col gap-8">
      {Object.entries(fields).map(([key, propVal]) =>
        isNonChildFieldPreviewProps(propVal) && (
          <FormValueContentFromPreviewProps autoFocus={key === firstFocusable} key={key} {...propVal} />
        ))}
    </div>
  )
}

function ConditionalFieldPreview({
  schema,
  autoFocus,
  discriminant,
  onChange,
  value
}) {
  const schemaDiscriminant = schema.discriminant
  return (
    <div className="flex flex-col gap-8">
      {useMemo(() => (
        <schemaDiscriminant.Input
          autoFocus={!!autoFocus}
          value={discriminant}
          onChange={onChange}
          forceValidation={false} />
      ), [autoFocus, schemaDiscriminant, discriminant, onChange])}
      {isNonChildFieldPreviewProps(value) && <FormValueContentFromPreviewProps {...value} />}
    </div>
  )
}

function isNonChildFieldPreviewProps(props) {
  return props.schema.kind !== 'child'
}

const fieldRenderers = {
  array: ArrayFieldPreview,
  relationship: RelationshipFieldPreview,
  child: () => null,
  form: FormFieldPreview,
  object: ObjectFieldPreview,
  conditional: ConditionalFieldPreview,
}

export const FormValueContentFromPreviewProps = memo(function FormValueContentFromPreview(props) {
  const Comp = fieldRenderers[props.schema.kind]
  return <Comp {...props} />
})

const OrderableItemInForm = memo(function OrderableItemInForm(props) {
  const [modalState, setModalState] = useState({ state: 'closed' })
  const onModalChange = useCallback((cb) => {
    setModalState(state => {
      if (state.state === 'open') {
        return { state: 'open', forceValidation: state.forceValidation, value: cb(state.value) }
      }
      return state
    })
  }, [setModalState])
  return (
    <OrderableItem elementKey={props.elementKey}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-1">
          <div className="flex items-center gap-1 cursor-pointer">
            <DragHandle />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setModalState({
                state: 'open',
                value: previewPropsToValue(props),
                forceValidation: false,
              })
            }}
            className="flex-grow justify-start"
          >
            <span className="text-base font-semibold text-left">
              {props.label}
            </span>
          </Button>
          <RemoveButton />
        </div>
        {isNonChildFieldPreviewProps(props) && (
          <AlertDialog
            open={modalState.state === 'open'}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setModalState({ state: 'closed' })
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Item</AlertDialogTitle>
              </AlertDialogHeader>
              {modalState.state === 'open' && (
                <ArrayFieldItemModalContent onChange={onModalChange} schema={props.schema} value={modalState.value} />
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (modalState.state !== 'open') return
                    if (!clientSideValidateProp(props.schema, modalState.value)) {
                      setModalState(state => ({ ...state, forceValidation: true }))
                      return
                    }
                    setValueToPreviewProps(modalState.value, props)
                    setModalState({ state: 'closed' })
                  }}
                >
                  Done
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </OrderableItem>
  )
})

function ArrayFieldItemModalContent(props) {
  const previewProps = useMemo(
    () => createGetPreviewProps(props.schema, props.onChange, () => undefined),
    [props.schema, props.onChange]
  )(props.value)
  return <FormValueContentFromPreviewProps {...previewProps} />
}

function findFocusableObjectFieldKey(schema) {
  for (const [key, innerProp] of Object.entries(schema.fields)) {
    const childFocusable = canFieldBeFocused(innerProp)
    if (childFocusable) {
      return key
    }
  }
  return undefined
}

export function canFieldBeFocused(schema) {
  if (
    schema.kind === 'array' ||
    schema.kind === 'conditional' ||
    schema.kind === 'form' ||
    schema.kind === 'relationship'
  ) {
    return true
  }
  if (schema.kind === 'child') {
    return false
  }
  if (schema.kind === 'object') {
    for (const innerProp of Object.values(schema.fields)) {
      if (canFieldBeFocused(innerProp)) {
        return true
      }
    }
    return false
  }
  assertNever(schema)
}
