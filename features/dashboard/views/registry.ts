/**
 * Field type registry
 * This file manages the registration and access to field types
 */

import * as React from 'react'
import * as text from "./text"
import * as select from "./select"
import * as integer from "./integer"
import * as timestamp from "./timestamp"
import * as float from "./float"
import * as id from "./id"
import * as json from "./json"
import * as password from "./password"
import * as virtual from "./virtual"
import * as relationship from "./relationship"
import * as image from "./image"
import * as document from "./document"
import * as checkbox from "./checkbox"
import * as bigInt from "./bigInt"
import * as decimal from "./decimal"

// Define interfaces for field implementations
export interface Field {
  path: string
  label: string
  description?: string
  fieldMeta?: {
    isRequired?: boolean
    min?: number
    max?: number
    isNullable?: boolean
    refListKey?: string
    refLabelField?: string
    many?: boolean
    plural?: string
    searchFields?: string[]
    query?: string
  }
  viewsIndex: number
}

// Type alias for the fieldMeta structure
export type FieldMetaType = Field['fieldMeta'];

export interface FieldControllerConfig {
  listKey: string;
  fieldMeta: FieldMetaType | undefined;
  label: string;
  description: string | null;
  path: string;
  customViews: Record<string, any>;
}

export interface FieldController<Value = unknown, InputValue = Value> {
  path: string;
  label: string;
  description?: string;
  graphqlSelection: string;
  defaultValue: Value;
  deserialize: (item: any) => Value;
  validate?: (value: Value) => boolean;
  serialize: (value: Value) => Record<string, any>;
  filter?: {
    Filter: React.ComponentType<FilterProps>;
    graphql: (args: { type: string; value: any }) => Record<string, any>;
    Label: (args: { label: string; type: string; value: any }) => string;
    types: Record<string, {
      label: string;
      initialValue: any;
    }>;
  };
}

interface FilterType {
  label: string
  initialValue: string | number | boolean
}

interface FilterTypes {
  [key: string]: FilterType
}

export interface FieldProps<Value = unknown> { // Add export
  field: Field
  value?: Value
  onChange?: (value: Value) => void
  forceValidation?: boolean
}

export interface CellProps { // Add export
  item: Record<string, any>
  field: Field
}

export interface FilterProps { // Add export
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
  operator: string
}

interface ClientImplementation<Value = unknown> {
  Field: React.ComponentType<FieldProps<Value>>
  Cell: React.ComponentType<CellProps>
  Filter: React.ComponentType<FilterProps>
  controller: (config: Field) => FieldController<Value>
}

interface ServerImplementation {
  getGraphQLSelection: (path: string, fieldMeta?: FieldMetaType) => string
  transformFilter?: (path: string, operator: string, value: any) => Record<string, any>
  getFilterTypes: () => FilterTypes
  formatFilterLabel: (operator: string, value: any) => string
}

export interface FieldImplementation {
  Field: (props: any) => React.ReactElement | null
  Cell: (props: any) => React.ReactElement | null
  controller: (args: any) => any
  allowedExportsOnCustomViews?: string[]
}

// Define the field types registry structure
interface FieldTypesRegistry {
  [key: string]: FieldImplementation
}

// Map of field types to their implementations
export const fieldTypes: FieldTypesRegistry = {
  text,
  select,
  integer,
  bigInt,
  timestamp,
  float,
  id,
  json,
  password,
  virtual,
  relationship,
  image,
  document,
  checkbox,
  decimal
}

// Type definition matching Keystone exactly
export type FieldViews = Record<
  number,
  {
    Field: React.ComponentType<any>
    Cell: React.ComponentType<any>
    CardValue: React.ComponentType<any>
    controller: (config: any) => any
  }
>

// Import the dynamically generated field type mapping
import { getFieldTypeFromViewsIndex } from './getFieldTypeFromViewsIndex'

/**
 * Get field implementation by viewsIndex - using the generated mapping
 */
export function getFieldViews(viewsIndex: number) {
  const fieldType = getFieldTypeFromViewsIndex(viewsIndex)
  const implementation = fieldTypes[fieldType]
  
  if (!implementation) {
    throw new Error(`Field type "${fieldType}" not found in registry`)
  }
  
  return implementation
}

/**
 * Unified function to get field implementation
 * 
 * This function returns the field implementation, which includes both
 * client-side and server-side functionality. Next.js enforces client/server
 * boundaries at runtime, so the appropriate functions will be available
 * based on the context.
 * 
 * @param fieldType The field type name (e.g., "select")
 * @returns The field implementation
 */
export function getField(fieldType: string): FieldImplementation {
  const implementation = fieldTypes[fieldType]
  if (!implementation) {
    throw new Error(`Field type "${fieldType}" not found`)
  }

  return implementation
}

// Import the dynamically generated field type mapping
export { getFieldTypeFromViewsIndex } from './getFieldTypeFromViewsIndex'