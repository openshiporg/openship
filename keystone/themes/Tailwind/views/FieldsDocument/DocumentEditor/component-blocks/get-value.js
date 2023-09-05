import { getKeysForArrayValue, setKeysForArrayValue } from "./preview-props"
import { assertNever } from "./utils"

const previewPropsToValueConverter = {
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
      value: previewPropsToValue(props.value)
    }
  },
  object(props) {
    return Object.fromEntries(
      Object.entries(props.fields).map(([key, val]) => [
        key,
        previewPropsToValue(val)
      ])
    )
  },
  relationship(props) {
    return props.value
  }
}

export function previewPropsToValue(props) {
  return previewPropsToValueConverter[props.schema.kind](props)
}

const valueToUpdaters = {
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
      value: valueToUpdater(x, schema.element)
    }))
  },
  conditional(value, schema) {
    return {
      discriminant: value.discriminant,
      value: valueToUpdater(
        value.value,
        schema.values[value.discriminant.toString()]
      )
    }
  },
  object(value, schema) {
    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, schema]) => [
        key,
        valueToUpdater(value[key], schema)
      ])
    )
  },
  relationship(value) {
    return value
  }
}

function valueToUpdater(value, schema) {
  return valueToUpdaters[schema.kind](value, schema)
}

export function setValueToPreviewProps(value, props) {
  if (isKind(props, "child")) {
    // child fields can't be updated through preview props, so we don't do anything here
    return
  }
  if (
    isKind(props, "form") ||
    isKind(props, "relationship") ||
    isKind(props, "object") ||
    isKind(props, "array")
  ) {
    props.onChange(valueToUpdater(value, props.schema))
    return
  }
  if (isKind(props, "conditional")) {
    const updater = valueToUpdater(value, props.schema)
    props.onChange(updater.discriminant, updater.value)
    return
  }
  assertNever(props)
}

// this exists because for props.schema.kind === 'form', ts doesn't narrow props, only props.schema
function isKind(props, kind) {
  return props.schema.kind === kind
}
