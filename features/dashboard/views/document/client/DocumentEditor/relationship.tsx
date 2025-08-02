import { createContext, useContext, Fragment } from 'react'
import { ReactEditor, type RenderElementProps } from 'slate-react'
import { Transforms } from 'slate'
import { useSlateStatic as useStaticEditor } from 'slate-react'

import { useList } from '@keystone-6/core/admin-ui/context'
import { RelationshipSelect } from '@keystone-6/core/fields/types/relationship/views/RelationshipSelect'

import { ToolbarButton } from './Toolbar'
import { useToolbarState } from './toolbar-state'
import type { Relationships } from './relationship-shared'
export type { Relationships } from './relationship-shared'

export const DocumentFieldRelationshipsContext = createContext<Relationships>({})

export function useDocumentFieldRelationships() {
  return useContext(DocumentFieldRelationshipsContext)
}

export const DocumentFieldRelationshipsProvider = DocumentFieldRelationshipsContext.Provider

export function RelationshipButton({ onClose }: { onClose: () => void }) {
  const {
    editor,
    relationships: { isDisabled }
  } = useToolbarState()
  const relationships = useContext(DocumentFieldRelationshipsContext)
  return (
    <Fragment>
      {Object.entries(relationships).map(([key, relationship]) => {
        return (
          <ToolbarButton
            key={key}
            isDisabled={isDisabled}
            onMouseDown={event => {
              event.preventDefault()
              Transforms.insertNodes(editor, {
                type: 'relationship',
                relationship: key,
                data: null,
                children: [{ text: '' }]
              })
              onClose()
            }}
          >
            {relationship.label}
          </ToolbarButton>
        )
      })}
    </Fragment>
  )
}

export function RelationshipElement({
  attributes,
  children,
  element,
}: RenderElementProps & { element: { type: 'relationship' } }) {
  const editor = useStaticEditor()
  const relationships = useContext(DocumentFieldRelationshipsContext)!
  const relationship = relationships[element.relationship]
  const list = useList(relationship.listKey)
  const searchFields = Object.keys(list.fields).filter(key => list.fields[key].search)

  return (
    <span
      {...attributes}
      className="inline-flex items-center"
    >
      <span
        contentEditable={false}
        className="select-none w-[200px] inline-block px-1 flex-1"
      >
        {relationship ? (
          <RelationshipSelect
            controlShouldRenderValue
            isDisabled={false}
            list={list}
            labelField={list.labelField}
            searchFields={searchFields}
            portalMenu
            state={{
              kind: 'one',
              value: element.data === null
                  ? null
                  : {
                      id: String(element.data.id),
                      label: String(element.data.label || element.data.id),
                      data: element.data.data,
                    },
              onChange(value) {
                const at = ReactEditor.findPath(editor, element)
                if (value === null) {
                  Transforms.removeNodes(editor, { at })
                } else {
                  Transforms.setNodes(editor, { data: value }, { at })
                }
              },
            }}
          />
        ) : (
          'Invalid relationship'
        )}
      </span>
      <span className="flex-0">{children}</span>
    </span>
  )
}
