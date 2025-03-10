import { useEffect, useMemo, useRef } from "react"
import { getInitialPropsValue } from "./DocumentEditor/component-blocks/initial-values"
import {
  assertNever,
  clientSideValidateProp
} from "./DocumentEditor/component-blocks/utils"
import { FormValueContentFromPreviewProps } from "./DocumentEditor/component-blocks/form-from-preview"
import { createGetPreviewProps } from "./DocumentEditor/component-blocks/preview-props"
import { FieldContainer } from '../../components/FieldContainer'
import { FieldLabel } from '../../components/FieldLabel'

export function Field({ field, value, onChange, autoFocus, forceValidation }) {
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  })
  const createPreviewProps = useMemo(() => {
    return createGetPreviewProps(
      field.schema,
      getNewVal => {
        onChange?.({
          kind: valueRef.current.kind,
          value: getNewVal(valueRef.current.value)
        })
      },
      () => undefined
    )
  }, [field.schema, onChange])
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <FormValueContentFromPreviewProps
        forceValidation={forceValidation}
        autoFocus={autoFocus}
        {...createPreviewProps(value.value)}
      />
    </FieldContainer>
  )
}

export const Cell = () => {
  return null
}

export const CardValue = () => {
  return null
}

export const allowedExportsOnCustomViews = ["schema"]

export function controller(config) {
  if (!config.customViews.schema) {
    throw new Error(
      `No schema in custom view. Did you forgot to set \`views\` to a file that exports a \`schema\` on ${config.listKey}.${config.path}`
    )
  }
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} { json(hydrateRelationships: true) }`,
    schema: config.customViews.schema,
    defaultValue: {
      kind: "create",
      value: getInitialPropsValue(config.customViews.schema)
    },
    validate: value =>
      clientSideValidateProp(config.customViews.schema, value.value),
    deserialize: data => {
      return {
        kind: "update",
        value: data[`${config.path}`]?.json ?? null
      }
    },
    serialize: value => {
      return {
        [config.path]: serializeValue(
          config.customViews.schema,
          value.value,
          value.kind
        )
      }
    }
  }
}

function serializeValue(schema, value, kind) {
  if (schema.kind === "conditional") {
    return {
      [value.discriminant]: serializeValue(
        schema.values[value.discriminant],
        value.value,
        kind
      )
    }
  }
  if (schema.kind === "array") {
    return value.map(a => serializeValue(schema.element, a, kind))
  }
  if (schema.kind === "form") {
    return value
  }
  if (schema.kind === "object") {
    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, val]) => {
        return [key, serializeValue(val, value[key], kind)]
      })
    )
  }
  if (schema.kind === "relationship") {
    if (Array.isArray(value)) {
      return {
        [kind === "create" ? "connect" : "set"]: value.map(x => ({ id: x.id }))
      }
    }
    if (value === null) {
      if (kind === "create") {
        return undefined
      }
      return { disconnect: true }
    }
    return {
      connect: { id: value.id }
    }
  }
  assertNever(schema)
}
