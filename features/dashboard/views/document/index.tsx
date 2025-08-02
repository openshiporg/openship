'use client'

import { Node } from 'slate'
import { DocumentRenderer } from '@keystone-6/document-renderer'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import weakMemoize from '@emotion/weak-memoize'
import { Editor, Text } from 'slate'

// Import required components from DocumentEditor folder
import { DocumentEditor } from './client/DocumentEditor'
import { ForceValidationProvider } from './client/DocumentEditor/utils-hooks'
import { createDocumentEditor } from './client/DocumentEditor/editor-shared'
import { clientSideValidateProp } from './client/DocumentEditor/component-blocks/utils'
import { isValidURL } from './client/DocumentEditor/isValidURL'

// Import components from the components folder
import { CellContainer, CellLink } from './client/components'
import { FieldContainer } from '@/components/ui/field-container'
import { FieldLabel } from '@/components/ui/field-label'
import { FieldDescription } from '@/components/ui/field-description'
// Inline Keystone types to avoid dependency issues
import type { JSONValue } from '@keystone-6/core/types'

export type FieldControllerConfig<FieldMeta extends JSONValue | undefined = undefined> = {
  listKey: string
  path: string
  label: string
  description: string | null
  customViews: Record<string, any>
  fieldMeta: FieldMeta
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
}
import { type Descendant } from 'slate'
import type { ComponentBlock } from './client/DocumentEditor/component-blocks/api-shared'
import type { Relationships } from './client/DocumentEditor/relationship-shared'

export type DocumentFeatures = {
  formatting: {
    inlineMarks: {
      bold: boolean
      italic: boolean
      underline: boolean
      strikethrough: boolean
      code: boolean
      superscript: boolean
      subscript: boolean
      keyboard: boolean
    }
    listTypes: {
      ordered: boolean
      unordered: boolean
    }
    alignment: {
      center: boolean
      end: boolean
    }
    headingLevels: (1 | 2 | 3 | 4 | 5 | 6)[]
    blockTypes: {
      blockquote: boolean
      code: boolean
    }
    softBreaks: boolean
  }
  links: boolean
  dividers: boolean
  layouts: [number, ...number[]][]
}

/**
 * Validates and fixes document structure to ensure all text nodes have a text property
 */
function validateAndFixDocument(document: any): any {
  if (!Array.isArray(document)) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }

  function fixNode(node: any): any {
    // Handle null or undefined nodes
    if (!node) {
      return { text: '' }
    }

    // Handle text nodes
    if (Text.isText(node) || (node && typeof node.text === 'string')) {
      return {
        ...node,
        text: typeof node.text === 'string' ? node.text : ''
      }
    }

    // Handle element nodes
    if (node && typeof node === 'object' && node.type) {
      return {
        type: node.type || 'paragraph',
        ...node,
        children: Array.isArray(node.children)
          ? node.children.map(fixNode).filter((child: any) => child !== null)
          : [{ text: '' }]
      }
    }

    // Handle arrays (shouldn't happen but just in case)
    if (Array.isArray(node)) {
      return node.map(fixNode).filter(child => child !== null)
    }

    // Invalid node, replace with empty text
    return { text: '' }
  }

  const fixedDocument = document.map(fixNode)

  // Ensure document is not empty
  if (fixedDocument.length === 0) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }

  return fixedDocument
}

/**
 * Main field component for document editor
 */
export function Field({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
}: any) {
  return (
    <FieldContainer className="overflow-hidden">
      <FieldLabel id={`${field.path}-label`}>
        {field.label}
      </FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <div className="border bg-background rounded-md overflow-hidden">
        <ForceValidationProvider value={!!forceValidation}>
          <DocumentEditor
            autoFocus={autoFocus}
            aria-labelledby={`${field.path}-label`}
            value={value}
            onChange={onChange}
            componentBlocks={field.componentBlocks}
            relationships={field.relationships}
            documentFeatures={field.documentFeatures}
          />
        </ForceValidationProvider>
      </div>
    </FieldContainer>
  )
}

/**
 * Controller for document fields
 */
export function controller(
  config: FieldControllerConfig<{
    relationships: Relationships
    documentFeatures: DocumentFeatures
    componentBlocksPassedOnServer: string[]
  }>
): FieldController<Descendant[]> & {
  componentBlocks: Record<string, ComponentBlock>
  relationships: Relationships
  documentFeatures: DocumentFeatures
} {
  const memoizedIsComponentBlockValid = weakMemoize((componentBlock: ComponentBlock) =>
    weakMemoize((props: any) =>
      clientSideValidateProp({ kind: 'object', fields: componentBlock.schema }, props)
    )
  )
  const componentBlocks: Record<string, ComponentBlock> = config.customViews.componentBlocks || {}
  const serverSideComponentBlocksSet = new Set(config.fieldMeta.componentBlocksPassedOnServer)
  const componentBlocksOnlyBeingPassedOnTheClient = Object.keys(componentBlocks).filter(
    x => !serverSideComponentBlocksSet.has(x)
  )
  if (componentBlocksOnlyBeingPassedOnTheClient.length) {
    throw new Error(
      `(${config.listKey}:${
        config.path
      }) The following component blocks are being passed in the custom view but not in the server-side field config: ${JSON.stringify(
        componentBlocksOnlyBeingPassedOnTheClient
      )}`
    )
  }
  const clientSideComponentBlocksSet = new Set(Object.keys(componentBlocks))
  const componentBlocksOnlyBeingPassedOnTheServer =
    config.fieldMeta.componentBlocksPassedOnServer.filter((x: string) => !clientSideComponentBlocksSet.has(x))
  if (componentBlocksOnlyBeingPassedOnTheServer.length) {
    throw new Error(
      `(${config.listKey}:${
        config.path
      }) The following component blocks are being passed in the server-side field config but not in the custom view: ${JSON.stringify(
        componentBlocksOnlyBeingPassedOnTheServer
      )}`
    )
  }
  const validateNode = weakMemoize((node: Node): boolean => {
    if (Text.isText(node)) {
      return true
    }
    if (node.type === 'component-block') {
      const componentBlock = componentBlocks[node.component as string]
      if (componentBlock) {
        if (!memoizedIsComponentBlockValid(componentBlock)(node.props)) {
          return false
        }
      }
    }
    if (node.type === 'link' && (typeof node.href !== 'string' || !isValidURL(node.href))) {
      return false
    }
    return node.children.every(node => validateNode(node))
  })
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} {document(hydrateRelationships: true)}`,
    componentBlocks: config.customViews.componentBlocks || {},
    documentFeatures: config.fieldMeta.documentFeatures,
    relationships: config.fieldMeta.relationships,
    defaultValue: [{ type: 'paragraph', children: [{ text: '' }] }],
    deserialize: (data: any) => {
      const documentFromServer = data[config.path]?.document
      if (!documentFromServer) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
      }

      // Validate and fix document structure before processing
      const validatedDocument = validateAndFixDocument(documentFromServer)

      // make a temporary editor to normalize the document
      const editor = createDocumentEditor(
        config.fieldMeta.documentFeatures,
        componentBlocks,
        config.fieldMeta.relationships
      )
      editor.children = validatedDocument
      Editor.normalize(editor, { force: true })
      return editor.children
    },
    serialize: (value: any) => ({
      [config.path]: value,
    }),
    validate(value: any) {
      return value.every((node: any) => validateNode(node))
    },
  }
}

/**
 * Helper function to serialize document nodes to plain text
 */
function serialize(nodes: any) {
  return nodes.map((n: any) => Node.string(n)).join('\n')
}

/**
 * Cell component for rendering document content in a list view
 */
export function Cell({ item, field, linkTo }: any) {
  const value = item[field.path]?.document
  if (!value || !Array.isArray(value)) {
    return linkTo ? (
      <CellLink {...linkTo}></CellLink>
    ) : (
      <CellContainer>
        <span className="text-muted-foreground">—</span>
      </CellContainer>
    )
  }
  
  const plainText = serialize(value)
  const cutText = plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText
  
  return linkTo ? (
    <CellLink {...linkTo}>{cutText}</CellLink>
  ) : (
    <CellContainer>{cutText}</CellContainer>
  )
}

Cell.supportsLinkTo = true

/**
 * CardValue component for rendering document in card view
 */
export function CardValue({ item, field }: any) {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <DocumentRenderer document={item[field.path]?.document || []} />
    </FieldContainer>
  )
}

interface FilterProps {
  value: string
  onChange: (value: string) => void
  operator: string
}

/**
 * Filter component for document fields
 */
export function Filter({ value, onChange, operator }: FilterProps) {
  // Get the filter type based on the operator
  operator = operator as keyof ReturnType<typeof getFilterTypes>

  // For boolean operators (is_empty)
  if (operator === 'is_empty') {
    return (
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={onChange}
        className="justify-start"
      >
        <ToggleGroupItem value="true" className="text-xs">
          Empty
        </ToggleGroupItem>
        <ToggleGroupItem value="false" className="text-xs">
          Not Empty
        </ToggleGroupItem>
      </ToggleGroup>
    )
  }

  // For text search operators
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter search text"
      className="w-full"
    />
  )
}

/**
 * Get available filter types for document fields
 */
export function getFilterTypes() {
  return {
    contains: {
      label: 'Contains text',
      initialValue: '',
    },
    not_contains: {
      label: 'Does not contain text',
      initialValue: '',
    },
    is_empty: {
      label: 'Is empty',
      initialValue: 'true',
    },
  }
}

export const allowedExportsOnCustomViews = ['componentBlocks']