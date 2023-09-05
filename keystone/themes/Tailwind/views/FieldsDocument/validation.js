"use client"
import { Text, Editor } from "slate"
import { createDocumentEditor } from "./DocumentEditor"
import { assertNever } from "./DocumentEditor/component-blocks/utils"
import {
  isRelationshipData,
  validateDocumentStructure
} from "./structure-validation"

export class PropValidationError extends Error {
  constructor(message, path) {
    super(message)
    this.path = path
  }
}

function validateComponentBlockProps(schema, value, relationships, path) {
  if (schema.kind === "form") {
    if (schema.validate(value)) {
      return value
    }
    throw new PropValidationError("Invalid form prop value", path)
  }
  if (schema.kind === "child") {
    return null
  }
  if (schema.kind === "relationship") {
    if (schema.many) {
      if (Array.isArray(value) && value.every(isRelationshipData)) {
        // yes, ts understands this completely correctly, i'm as suprised as you are
        return value.map(x => ({ id: x.id }))
      } else {
        throw new PropValidationError(`Invalid relationship value`, path)
      }
    }
    if (value === null || isRelationshipData(value)) {
      return value === null ? null : { id: value.id }
    } else {
      throw new PropValidationError(`Invalid relationship value`, path)
    }
  }

  if (schema.kind === "conditional") {
    if (typeof value !== "object" || value === null) {
      throw new PropValidationError("Conditional value must be an object", path)
    }
    for (const key of Object.keys(value)) {
      if (key !== "discriminant" && key !== "value") {
        throw new PropValidationError(
          `Conditional value only allows keys named "discriminant" and "value", not "${key}"`,
          path
        )
      }
    }
    const discriminant = value.discriminant
    const val = value.value
    // for some reason mongo or mongoose or something is saving undefined as null
    // so we're doing this so that we avoid setting undefined on objects
    const obj = {}
    const discriminantVal = validateComponentBlockProps(
      schema.discriminant,
      discriminant,
      relationships,
      path.concat("discriminant")
    )
    if (discriminantVal !== undefined) {
      obj.discriminant = discriminantVal
    }
    const conditionalFieldValue = validateComponentBlockProps(
      schema.values[discriminant],
      val,
      relationships,
      path.concat("value")
    )
    if (conditionalFieldValue !== undefined) {
      obj.value = conditionalFieldValue
    }
    return obj
  }

  if (schema.kind === "object") {
    if (typeof value !== "object" || value === null) {
      throw new PropValidationError("Object value must be an object", path)
    }
    const allowedKeysSet = new Set(Object.keys(schema.fields))
    for (const key of Object.keys(value)) {
      if (!allowedKeysSet.has(key)) {
        throw new PropValidationError(
          `Key on object value "${key}" is not allowed`,
          path
        )
      }
    }
    let val = {}
    for (const key of Object.keys(schema.fields)) {
      const propVal = validateComponentBlockProps(
        schema.fields[key],
        value[key],
        relationships,
        path.concat(key)
      )
      // for some reason mongo or mongoose or something is saving undefined as null
      // so we're doing this so that we avoid setting undefined on objects
      if (propVal !== undefined) {
        val[key] = propVal
      }
    }
    return val
  }
  if (schema.kind === "array") {
    if (!Array.isArray(value)) {
      throw new PropValidationError("Array field value must be an array", path)
    }
    return value.map((innerVal, i) => {
      return validateComponentBlockProps(
        schema.element,
        innerVal,
        relationships,
        path.concat(i)
      )
    })
  }
  assertNever(schema)
}

function isText(node) {
  return Text.isText(node)
}

// note that the errors thrown from here will only be exposed
// as internal server error from the graphql api in prod
// this is fine because these cases are pretty much all about
// malicious content being inserted, not valid content
export function getValidatedNodeWithNormalizedComponentFormProps(
  node,
  componentBlocks,
  relationships
) {
  if (isText(node)) {
    return node
  }
  if (node.type === "component-block") {
    if (componentBlocks.hasOwnProperty(node.component)) {
      const componentBlock = componentBlocks[node.component]
      node = {
        ...node,
        props: validateComponentBlockProps(
          { kind: "object", fields: componentBlock.schema },
          node.props,
          relationships,
          []
        )
      }
    }
  }

  if (node.type === "relationship") {
    node = {
      type: "relationship",
      data:
        node.data?.id !== undefined
          ? { id: node.data.id, data: undefined, label: undefined }
          : null,
      relationship: node.relationship,
      children: node.children
    }
  }
  return {
    ...node,
    children: node.children.map(x =>
      getValidatedNodeWithNormalizedComponentFormProps(
        x,
        componentBlocks,
        relationships
      )
    )
  }
}

export function validateAndNormalizeDocument(
  value,
  documentFeatures,
  componentBlocks,
  relationships
) {
  validateDocumentStructure(value)
  const children = value.map(x =>
    getValidatedNodeWithNormalizedComponentFormProps(
      x,
      componentBlocks,
      relationships
    )
  )
  const editor = createDocumentEditor(
    documentFeatures,
    componentBlocks,
    relationships
  )
  editor.children = children
  Editor.normalize(editor, { force: true })
  return editor.children
}
