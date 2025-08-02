import type { ReactElement } from 'react'

export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[]

export type GraphQLNames = {
  listQueryName: string
  itemQueryName: string
  listQueryCountName: string
  listOrderName: string
  deleteMutationName: string
  updateMutationName: string
  createMutationName: string
  updateManyMutationName: string
  deleteManyMutationName: string
  whereInputName: string
  whereUniqueInputName: string
  createInputName: string
  updateInputName: string
  orderByInputName: string
  outputTypeName: string
  relateToManyForCreateInputName: string
  relateToManyForUpdateInputName: string
  relateToOneForCreateInputName: string
  relateToOneForUpdateInputName: string
}

export type FieldControllerConfig<FieldMeta extends JSONValue | undefined = undefined> = {
  listKey: string
  path: string
  label: string
  description: string | null
  customViews: Record<string, any>
  fieldMeta: FieldMeta
}

type FilterTypeDeclaration<Value extends JSONValue> = {
  readonly label: string
  readonly initialValue: Value
}

export type FilterTypeToFormat<Value extends JSONValue> = {
  readonly type: string
  readonly label: string
  readonly value: Value
}

export type FieldController<
  FormState,
  FilterValue extends JSONValue = never,
  GraphQLFilterValue = never,
> = {
  path: string
  label: string
  description: string | null
  graphqlSelection: string
  defaultValue: FormState
  deserialize: (item: any) => FormState
  serialize: (formState: FormState) => any
  validate?: (formState: FormState, opts: { isRequired: boolean }) => boolean
  filter?: {
    types: Record<string, FilterTypeDeclaration<FilterValue>>
    parseGraphQL(value: GraphQLFilterValue & {}): { type: string; value: FilterValue }[]
    graphql(type: { type: string; value: FilterValue }): Record<string, any>
    Label(type: FilterTypeToFormat<FilterValue>): string | ReactElement | null
    Filter(props: {
      autoFocus?: boolean
      forceValidation?: boolean
      context: 'add' | 'edit'
      onChange(value: FilterValue): void
      type: string
      typeLabel?: string
      value: FilterValue
    }): ReactElement | null
  }
}

export type FieldMeta = {
  path: string
  label: string
  description: string | null
  fieldMeta: JSONValue | null

  viewsIndex: number
  customViewsIndex: number | null
  views: any
  controller: FieldController<unknown, JSONValue>

  search: 'default' | 'insensitive' | null
  graphql: {
    isNonNull: ('read' | 'create' | 'update')[]
  }
  createView: {
    fieldMode: any
    isRequired: any
  }
  itemView: {
    fieldMode: any
    isRequired: any
    fieldPosition: 'form' | 'sidebar'
  }
  listView: {
    fieldMode: 'read' | 'hidden'
  }

  isFilterable: boolean
  isOrderable: boolean
}

export type FieldGroupMeta = {
  label: string
  description: string | null
  fields: FieldMeta[]
}

export type ListMeta = {
  key: string
  path: string
  description: string | null

  label: string
  labelField: string
  singular: string
  plural: string

  fields: { [path: string]: FieldMeta }
  groups: FieldGroupMeta[]
  graphql: {
    names: GraphQLNames
  }

  pageSize: number
  initialColumns: string[]
  initialSearchFields: string[]
  initialSort: null | { direction: 'ASC' | 'DESC'; field: string }
  initialFilter: JSONValue
  isSingleton: boolean

  hideNavigation: boolean
  hideCreate: boolean
  hideDelete: boolean
}

export type AdminMeta = {
  lists: { [list: string]: ListMeta }
}

export type Item = {
  [key: string]: unknown
}

export type FieldProps<FieldControllerFn extends (...args: any) => FieldController<any, any>> = {
  autoFocus?: boolean
  field: ReturnType<FieldControllerFn>
  isRequired: boolean
  forceValidation?: boolean
  onChange?(value: ReturnType<ReturnType<FieldControllerFn>['deserialize']>): void
  value: ReturnType<ReturnType<FieldControllerFn>['deserialize']>
  itemValue: Item
}

export type CellComponent<
  FieldControllerFn extends (...args: any) => FieldController<any, any> = () => FieldController<
    any,
    any
  >,
> = {
  (props: {
    value: any
    field: ReturnType<FieldControllerFn>
    item: Record<string, unknown>
  }): ReactElement | null
}

export type FieldViews = Record<
  string,
  {
    Field: (props: FieldProps<any>) => ReactElement | null
    Cell: CellComponent
    controller: (args: FieldControllerConfig<any>) => FieldController<unknown, JSONValue>
    allowedExportsOnCustomViews?: string[]
  }
>