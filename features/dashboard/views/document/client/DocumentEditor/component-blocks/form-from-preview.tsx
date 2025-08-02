import { useList } from '@keystone-6/core/admin-ui/context'
import { RelationshipSelect } from '@/features/dashboard/views/relationship/client/components/RelationshipSelect'

import { Button } from '@/components/ui/button'
import { Dialog as ShadDialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { TooltipProvider, Tooltip as ShadTooltip, TooltipTrigger as ShadTooltipTrigger, TooltipContent as ShadTooltipContent } from '@/components/ui/tooltip'
import { Trash2 } from 'lucide-react'

import {
  type Key,
  type MemoExoticComponent,
  type ReactElement,
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react'
import type {
  ArrayField,
  ComponentSchema,
  ConditionalField,
  FormField,
  GenericPreviewProps,
  InitialOrUpdateValueFromComponentPropField,
  ObjectField,
  RelationshipField,
  ValueForComponentSchema,
} from './api'
import { getKeysForArrayValue, setKeysForArrayValue } from './preview-props'

import { assertNever, clientSideValidateProp } from './utils'
import { createGetPreviewProps } from './preview-props'

type DefaultFieldProps<Key> = GenericPreviewProps<
  Extract<ComponentSchema, { kind: Key }>,
  unknown
> & {
  autoFocus?: boolean
  forceValidation?: boolean
}

const previewPropsToValueConverter: {
  [Kind in ComponentSchema['kind']]: (
    props: GenericPreviewProps<Extract<ComponentSchema, { kind: Kind }>, unknown>
  ) => ValueForComponentSchema<Extract<ComponentSchema, { kind: Kind }>>
} = {
  child() {
    return null
  },
  form(props) {
    return props.value
  },
  array(props) {
    const values = props.elements.map(x => previewPropsToValue(x))
    setKeysForArrayValue(
      values,
      props.elements.map(x => x.key)
    )
    return values
  },
  conditional(props) {
    return {
      discriminant: props.discriminant,
      value: previewPropsToValue(props.value),
    }
  },
  object(props) {
    return Object.fromEntries(
      Object.entries(props.fields).map(([key, val]) => [key, previewPropsToValue(val)])
    )
  },
  relationship(props) {
    return props.value
  },
}

const valueToUpdaters: {
  [Kind in ComponentSchema['kind']]: (
    value: ValueForComponentSchema<Extract<ComponentSchema, { kind: Kind }>>,
    schema: Extract<ComponentSchema, { kind: Kind }>
  ) => InitialOrUpdateValueFromComponentPropField<Extract<ComponentSchema, { kind: Kind }>>
} = {
  child() {
    return undefined
  },
  form(value) {
    return value
  },
  array(value, schema) {
    const keys = getKeysForArrayValue(value)
    return value.map((x, i) => ({
      key: keys[i],
      value: valueToUpdater(x, schema.element),
    }))
  },
  conditional(value, schema) {
    return {
      discriminant: value.discriminant,
      value: valueToUpdater(value.value, schema.values[value.discriminant.toString()]),
    }
  },
  object(value, schema) {
    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, schema]) => [
        key,
        valueToUpdater(value[key], schema),
      ])
    )
  },
  relationship(value) {
    return value
  },
}

export function previewPropsToValue<Schema extends ComponentSchema>(
  props: GenericPreviewProps<ComponentSchema, unknown>
): ValueForComponentSchema<Schema> {
  return (previewPropsToValueConverter[props.schema.kind] as any)(props)
}

function valueToUpdater<Schema extends ComponentSchema>(
  value: ValueForComponentSchema<Schema>,
  schema: ComponentSchema
): InitialOrUpdateValueFromComponentPropField<Schema> {
  return (valueToUpdaters[schema.kind] as any)(value, schema)
}

// this exists because for props.schema.kind === 'form', ts doesn't narrow props, only props.schema
function isKind<Kind extends ComponentSchema['kind']>(
  props: GenericPreviewProps<ComponentSchema, unknown>,
  kind: Kind
): props is GenericPreviewProps<Extract<ComponentSchema, { kind: Kind }>, unknown> {
  return props.schema.kind === kind
}

export function previewPropsOnChange<Schema extends ComponentSchema>(
  value: ValueForComponentSchema<Schema>,
  props: GenericPreviewProps<ComponentSchema, unknown>
) {
  // child fields can't be updated through preview props, so we don't do anything here
  if (isKind(props, 'child')) return
  if (
    isKind(props, 'form') ||
    isKind(props, 'relationship') ||
    isKind(props, 'object') ||
    isKind(props, 'array')
  ) {
    props.onChange(valueToUpdater(value, props.schema))
    return
  }
  if (isKind(props, 'conditional')) {
    const updater = valueToUpdater(value, props.schema)
    props.onChange(updater.discriminant, updater.value)
    return
  }
  assertNever(props)
}

function ArrayFieldPreview(props: DefaultFieldProps<'array'>) {
  const { elements, onChange, schema } = props
  const { label } = schema
  const [modalState, setModalState] = useState<
    | {
        index: number
        value: unknown
        forceValidation: boolean
      }
    | 'closed'
  >('closed')

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-3" role="group">
        <ArrayFieldListView
          {...props}
          aria-label={label ?? ''}
          onOpenItem={index => {
            const element = elements.at(index)
            if (!element) return
            setModalState({
              index,
              value: previewPropsToValue(element),
              forceValidation: false,
            })
          }}
        />
        <Button
          variant="outline"
          className="self-start"
          autoFocus={props.autoFocus}
          onClick={() => {
            onChange([...elements.map(x => ({ key: x.key })), { key: undefined }])
          }}
        >
          Add
        </Button>
        {modalState !== 'closed' && props.schema.element.kind !== 'child' && (() => {
          const element = elements.at(modalState.index)
          if (!element) return null
          const onModalChange = (cb: (value: unknown) => unknown) => {
            setModalState(state => {
              if (state === 'closed') return state
              return {
                index: modalState.index,
                forceValidation: state.forceValidation,
                value: cb(state.value),
              }
            })
          }
          return (
            <ShadDialog open={true} onOpenChange={(open) => !open && setModalState('closed')}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit item</DialogTitle>
                </DialogHeader>
                <ArrayFieldItemModalContent
                  onChange={onModalChange}
                  schema={element.schema as any}
                  value={modalState.value}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModalState('closed')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!clientSideValidateProp(element.schema, modalState.value)) {
                        setModalState(state => ({
                          ...(state as any),
                          forceValidation: true,
                        }))
                        return
                      }
                      previewPropsOnChange(modalState.value, element)
                      setModalState('closed')
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </ShadDialog>
          )
        })()}
      </div>
    </div>
  )
}

function RelationshipFieldPreview(props: DefaultFieldProps<'relationship'>) {
  const { autoFocus, onChange, schema, value } = props
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
        state={
          schema.many
            ? {
                kind: 'many',
                value: (Array.isArray(value) ? value : []).map((x: any) => ({
                  id: x.id,
                  label: x.label || x.id,
                  data: x.data,
                })),
                onChange: onChange,
              }
            : {
                kind: 'one',
                value: value && !Array.isArray(value)
                  ? {
                      ...value,
                      label: (value as any).label || (value as any).id,
                    }
                  : null,
                onChange: onChange,
              }
        }
      />
    </div>
  )
}

function FormFieldPreview({
  schema,
  autoFocus,
  forceValidation,
  onChange,
  value,
}: DefaultFieldProps<'form'>) {
  return (
    <schema.Input
      autoFocus={!!autoFocus}
      value={value}
      onChange={onChange}
      forceValidation={!!forceValidation}
    />
  )
}

function canFieldBeFocused(schema: ComponentSchema): boolean {
  if (schema.kind === 'child') return false
  if (schema.kind === 'array') return true
  if (schema.kind === 'conditional') return true
  if (schema.kind === 'form') return true
  if (schema.kind === 'relationship') return true
  if (schema.kind === 'object') {
    for (const innerProp of Object.values(schema.fields)) {
      if (canFieldBeFocused(innerProp)) return true
    }
    return false
  }
  assertNever(schema)
}

function findFocusableObjectFieldKey(schema: ObjectField): string | undefined {
  for (const [key, innerProp] of Object.entries(schema.fields)) {
    const childFocusable = canFieldBeFocused(innerProp)
    if (childFocusable) return key
  }
}

function ObjectFieldPreview({ schema, autoFocus, fields }: DefaultFieldProps<'object'>) {
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
  value,
}: DefaultFieldProps<'conditional'>) {
  const schemaDiscriminant = schema.discriminant as FormField<string | boolean, unknown>
  return (
    <div className="flex items-start gap-6">
      {useMemo(
        () => (
          <schemaDiscriminant.Input
            autoFocus={!!autoFocus}
            value={discriminant}
            onChange={onChange}
            forceValidation={false}
          />
        ),
        [autoFocus, schemaDiscriminant, discriminant, onChange]
      )}
      {isNonChildFieldPreviewProps(value) && <FormValueContentFromPreviewProps {...value} />}
    </div>
  )
}

export type NonChildFieldComponentSchema =
  | FormField<any, any>
  | ObjectField
  | ConditionalField<FormField<any, any>, { [key: string]: ComponentSchema }>
  | RelationshipField<boolean>
  | ArrayField<ComponentSchema>

function isNonChildFieldPreviewProps(
  props: GenericPreviewProps<ComponentSchema, unknown>
): props is GenericPreviewProps<NonChildFieldComponentSchema, unknown> {
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

export const FormValueContentFromPreviewProps: MemoExoticComponent<
  (
    props: GenericPreviewProps<ComponentSchema, unknown> & {
      autoFocus?: boolean
      forceValidation?: boolean
    }
  ) => ReactElement
> = memo(function FormValueContentFromPreview(props) {
  const Comp = fieldRenderers[props.schema.kind]
  return <Comp {...(props as any)} />
})

function useEventCallback<Func extends (...args: any) => any>(callback: Func): Func {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args: any[]) => {
    return callbackRef.current(...args)
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb as any
}

function ArrayFieldListView<Element extends ComponentSchema>(
  props: GenericPreviewProps<ArrayField<Element>, unknown> & {
    'aria-label': string
    onOpenItem: (index: number) => void
  }
) {
  // Drag and drop functionality from Keystar's ListView and useDragAndDrop has been removed.
  // This will require a new implementation if DND is needed.
  const onRemoveKey = useEventCallback((key: string) => {
    props.onChange(props.elements.map(x => ({ key: x.key })).filter(val => val.key !== key))
  })

  if (!props.elements.length) {
    return arrayFieldEmptyState();
  }

  return (
    <div className="border rounded-md p-2 space-y-2" aria-label={props['aria-label']}>
      {props.elements.map((item, index) => {
        const label = props.schema.itemLabel?.(item) || `Item ${index + 1}`
        return (
          <div key={item.key} className="flex items-center justify-between p-2 border-b last:border-b-0">
            <button type="button" onClick={() => props.onOpenItem(index)} className="flex-grow text-left hover:underline">
              <p>{label}</p>
            </button>
            <TooltipProvider>
              <ShadTooltip>
                <ShadTooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onRemoveKey(item.key)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ShadTooltipTrigger>
                <ShadTooltipContent side="left">
                  <p>Delete</p>
                </ShadTooltipContent>
              </ShadTooltip>
            </TooltipProvider>
          </div>
        )
      })}
    </div>
  )
}

function ArrayFieldItemModalContent(props: {
  schema: NonChildFieldComponentSchema
  value: unknown
  onChange: (cb: (value: unknown) => unknown) => void
}) {
  const previewProps = useMemo(
    () => createGetPreviewProps(props.schema, props.onChange, () => undefined),
    [props.schema, props.onChange]
  )(props.value)
  return <FormValueContentFromPreviewProps {...previewProps} />
}

function arrayFieldEmptyState() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center h-full p-3 text-center">
      <h3 className="text-lg font-medium text-neutral-600">
        Empty list
      </h3>
      <p className="text-sm text-neutral-500">
        Add the first item to see it here.
      </p>
    </div>
  )
}
