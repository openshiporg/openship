import { Input } from '@/components/ui/input'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
import type {
  CellComponent,
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '../../types'

function stringify(value: unknown) {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  if (typeof value !== 'object') return JSON.stringify(value)

  const omitTypename = (key: string, value: any) => (key === '__typename' ? undefined : value)
  const dataWithoutTypename = JSON.parse(JSON.stringify(value), omitTypename)
  return JSON.stringify(dataWithoutTypename, null, 2)
}

export function Field(props: FieldProps<typeof controller>) {
  const { field, value } = props
  if (value === createViewValue) return null

  return (
    <FieldContainer>
      <FieldLabel>
        {field.label}
      </FieldLabel>
      {field.description && (
        <FieldDescription>
          {field.description}
        </FieldDescription>
      )}
      <Input
        readOnly={true}
        tabIndex={-1}
        value={stringify(value)}
        className="bg-muted cursor-default"
        onFocus={(e) => e.target.blur()}
      />
    </FieldContainer>
  )
}

export const Cell: CellComponent<typeof controller> = ({ value }: { value: any; field: any; item: Record<string, unknown> }) => {
  return value != null ? <span>{stringify(value)}</span> : null
}

const createViewValue = Symbol('create view virtual field value')

export function controller(
  config: FieldControllerConfig<{ query: string }>
): FieldController<unknown> {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path}${config.fieldMeta.query}`,
    defaultValue: createViewValue,
    deserialize: data => data[config.path],
    serialize: () => ({}),
  }
}