import { assert } from "../utils"
import { getKeysForArrayValue, setKeysForArrayValue } from "./preview-props"

export function findChildPropPathsForProp(value, schema, path) {
  switch (schema.kind) {
    case "form":
    case "relationship":
      return []
    case "child":
      return [{ path: path, options: schema.options }]
    case "conditional":
      return findChildPropPathsForProp(
        value.value,
        schema.values[value.discriminant],
        path.concat("value")
      )
    case "object": {
      const paths = []
      Object.keys(schema.fields).forEach(key => {
        paths.push(
          ...findChildPropPathsForProp(
            value[key],
            schema.fields[key],
            path.concat(key)
          )
        )
      })
      return paths
    }
    case "array": {
      const paths = []
      value.forEach((val, i) => {
        paths.push(
          ...findChildPropPathsForProp(val, schema.element, path.concat(i))
        )
      })
      return paths
    }
  }
}

export function findChildPropPaths(value, props) {
  const propPaths = findChildPropPathsForProp(
    value,
    { kind: "object", fields: props },
    []
  )
  if (!propPaths.length) {
    return [
      {
        path: undefined,
        options: { kind: "inline", placeholder: "" }
      }
    ]
  }
  return propPaths
}

export function assertNever(arg) {
  throw new Error(
    "expected to never be called but received: " + JSON.stringify(arg)
  )
}

export function getDocumentFeaturesForChildField(
  editorDocumentFeatures,
  options
) {
  // an important note for this: normalization based on document features
  // is done based on the document features returned here
  // and the editor document features
  // so the result for any given child prop will be the things that are
  // allowed by both these document features
  // AND the editor document features
  const inlineMarksFromOptions = options.formatting?.inlineMarks

  const inlineMarks =
    inlineMarksFromOptions === "inherit"
      ? "inherit"
      : Object.fromEntries(
          Object.keys(editorDocumentFeatures.formatting.inlineMarks).map(
            mark => {
              return [mark, !!(inlineMarksFromOptions || {})[mark]]
            }
          )
        )
  if (options.kind === "inline") {
    return {
      kind: "inline",
      inlineMarks,
      documentFeatures: {
        links: options.links === "inherit",
        relationships: options.relationships === "inherit"
      },
      softBreaks: options.formatting?.softBreaks === "inherit"
    }
  }
  return {
    kind: "block",
    inlineMarks,
    softBreaks: options.formatting?.softBreaks === "inherit",
    documentFeatures: {
      layouts: [],
      dividers:
        options.dividers === "inherit"
          ? editorDocumentFeatures.dividers
          : false,
      formatting: {
        alignment:
          options.formatting?.alignment === "inherit"
            ? editorDocumentFeatures.formatting.alignment
            : {
                center: false,
                end: false
              },
        blockTypes:
          options.formatting?.blockTypes === "inherit"
            ? editorDocumentFeatures.formatting.blockTypes
            : {
                blockquote: false,
                code: false
              },
        headingLevels:
          options.formatting?.headingLevels === "inherit"
            ? editorDocumentFeatures.formatting.headingLevels
            : options.formatting?.headingLevels || [],
        listTypes:
          options.formatting?.listTypes === "inherit"
            ? editorDocumentFeatures.formatting.listTypes
            : {
                ordered: false,
                unordered: false
              }
      },
      links: options.links === "inherit",
      relationships: options.relationships === "inherit"
    }
  }
}

function getSchemaAtPropPathInner(path, value, schema) {
  // because we're checking the length here
  // the non-null asserts on shift below are fine
  if (path.length === 0) {
    return schema
  }
  if (
    schema.kind === "child" ||
    schema.kind === "form" ||
    schema.kind === "relationship"
  ) {
    return
  }
  if (schema.kind === "conditional") {
    const key = path.shift()
    if (key === "discriminant") {
      return getSchemaAtPropPathInner(
        path,
        value.discriminant,
        schema.discriminant
      )
    }
    if (key === "value") {
      const propVal = schema.values[value.discriminant]
      return getSchemaAtPropPathInner(path, value.value, propVal)
    }
    return
  }
  if (schema.kind === "object") {
    const key = path.shift()
    return getSchemaAtPropPathInner(path, value[key], schema.fields[key])
  }
  if (schema.kind === "array") {
    const index = path.shift()
    return getSchemaAtPropPathInner(path, value[index], schema.element)
  }
  assertNever(schema)
}

export function getSchemaAtPropPath(path, value, props) {
  return getSchemaAtPropPathInner([...path], value, {
    kind: "object",
    fields: props
  })
}

export function clientSideValidateProp(schema, value) {
  switch (schema.kind) {
    case "child":
    case "relationship": {
      return true
    }
    case "form": {
      return schema.validate(value)
    }
    case "conditional": {
      if (!schema.discriminant.validate(value.discriminant)) {
        return false
      }
      return clientSideValidateProp(
        schema.values[value.discriminant],
        value.value
      )
    }
    case "object": {
      for (const [key, childProp] of Object.entries(schema.fields)) {
        if (!clientSideValidateProp(childProp, value[key])) {
          return false
        }
      }
      return true
    }
    case "array": {
      for (const innerVal of value) {
        if (!clientSideValidateProp(schema.element, innerVal)) {
          return false
        }
      }
      return true
    }
  }
}

export function getAncestorSchemas(rootSchema, path, value) {
  const ancestors = []
  const currentPath = [...path]
  let currentProp = rootSchema
  let currentValue = value
  while (currentPath.length) {
    ancestors.push(currentProp)
    const key = currentPath.shift() // this code only runs when path.length is truthy so this non-null assertion is fine
    if (currentProp.kind === "array") {
      currentProp = currentProp.element
      currentValue = currentValue[key]
    } else if (currentProp.kind === "conditional") {
      currentProp = currentProp.values[value.discriminant]
      currentValue = currentValue.value
    } else if (currentProp.kind === "object") {
      currentValue = currentValue[key]
      currentProp = currentProp.fields[key]
    } else if (
      currentProp.kind === "child" ||
      currentProp.kind === "form" ||
      currentProp.kind === "relationship"
    ) {
      throw new Error(`unexpected prop "${key}"`)
    } else {
      assertNever(currentProp)
    }
  }
  return ancestors
}

export function getValueAtPropPath(value, inputPath) {
  const path = [...inputPath]
  while (path.length) {
    const key = path.shift()
    value = value[key]
  }
  return value
}

export function traverseProps(schema, value, visitor, path = []) {
  if (
    schema.kind === "form" ||
    schema.kind === "relationship" ||
    schema.kind === "child"
  ) {
    visitor(schema, value, path)
    return
  }
  if (schema.kind === "object") {
    for (const [key, childProp] of Object.entries(schema.fields)) {
      traverseProps(childProp, value[key], visitor, [...path, key])
    }
    visitor(schema, value, path)
    return
  }
  if (schema.kind === "array") {
    for (const [idx, val] of value.entries()) {
      traverseProps(schema.element, val, visitor, path.concat(idx))
    }
    return visitor(schema, value, path)
  }
  if (schema.kind === "conditional") {
    const discriminant = value.discriminant
    visitor(schema, discriminant, path.concat("discriminant"))
    traverseProps(
      schema.values[discriminant.toString()],
      value.value,
      visitor,
      path.concat("value")
    )
    visitor(schema, value, path)
    return
  }
  assertNever(schema)
}

export function replaceValueAtPropPath(schema, value, newValue, path) {
  if (path.length === 0) {
    return newValue
  }

  const [key, ...newPath] = path

  if (schema.kind === "object") {
    return {
      ...value,
      [key]: replaceValueAtPropPath(
        schema.fields[key],
        value[key],
        newValue,
        newPath
      )
    }
  }

  if (schema.kind === "conditional") {
    const conditionalValue = value
    // replaceValueAtPropPath should not be used to only update the discriminant of a conditional field
    // if you want to update the discriminant of a conditional field, replace the value of the whole conditional field
    assert(key === "value")
    return {
      discriminant: conditionalValue.discriminant,
      value: replaceValueAtPropPath(
        schema.values[key],
        conditionalValue.value,
        newValue,
        newPath
      )
    }
  }

  if (schema.kind === "array") {
    const prevVal = value
    const newVal = [...prevVal]
    setKeysForArrayValue(newVal, getKeysForArrayValue(prevVal))
    newVal[key] = replaceValueAtPropPath(
      schema.element,
      newVal[key],
      newValue,
      newPath
    )
    return newVal
  }

  // we should never reach here since form, relationship or child fields don't contain other fields
  // so the only thing that can happen to them is to be replaced which happens at the start of this function when path.length === 0
  assert(
    schema.kind !== "form" &&
      schema.kind !== "relationship" &&
      schema.kind !== "child"
  )

  assertNever(schema)
}

export function getPlaceholderTextForPropPath(propPath, fields, formProps) {
  const field = getSchemaAtPropPath(propPath, formProps, fields)
  if (field?.kind === "child") {
    return field.options.placeholder
  }
  return ""
}
