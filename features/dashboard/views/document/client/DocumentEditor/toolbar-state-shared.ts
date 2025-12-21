import { Element, Editor, Range, Text, type Location } from 'slate'
import { type DocumentFeatures } from '../../index'
import { type ComponentBlock } from './component-blocks/api-shared'
import {
  type DocumentFeaturesForChildField,
  getSchemaAtPropPath,
  getDocumentFeaturesForChildField,
} from './component-blocks/utils'
import { isListNode } from './lists-shared'
import { allMarks, isElementActive, type Mark, nodeTypeMatcher } from './utils'

type BasicToolbarItem = { isSelected: boolean; isDisabled: boolean }

// component blocks are not in the ToolbarState because they're inserted in the closest available place and the selected state is not shown in the toolbar

// note that isDisabled being false here does not mean the action should be allowed
// it means that the action should be allowed if isDisabled is false AND the relevant document feature is enabled
// (because things are hidden if they're not enabled in the editor document features)
export type ToolbarState = {
  textStyles: {
    selected: 'normal' | 1 | 2 | 3 | 4 | 5 | 6
    allowedHeadingLevels: (1 | 2 | 3 | 4 | 5 | 6)[]
  }
  marks: {
    [key in Mark]: BasicToolbarItem
  }
  clearFormatting: {
    isDisabled: boolean
  }
  alignment: {
    selected: 'start' | 'center' | 'end'
    isDisabled: boolean
  }
  lists: { ordered: BasicToolbarItem; unordered: BasicToolbarItem }
  links: BasicToolbarItem
  blockquote: BasicToolbarItem
  // note that layouts can't be disabled because they are inserted
  // so they will be inserted to the closest valid location
  // unlike the other things here which wrap elements
  layouts: { isSelected: boolean }
  dividers: { isDisabled: boolean }
  code: BasicToolbarItem
  relationships: { isDisabled: boolean }
  editor: Editor
  editorDocumentFeatures: DocumentFeatures
}

export function getAncestorComponentChildFieldDocumentFeatures(
  editor: Editor,
  editorDocumentFeatures: DocumentFeatures,
  componentBlocks: Record<string, ComponentBlock>
): DocumentFeaturesForChildField | undefined {
  const ancestorComponentProp = Editor.above(editor, {
    match: nodeTypeMatcher('component-block-prop', 'component-inline-prop'),
  })

  if (ancestorComponentProp) {
    const propPath = ancestorComponentProp[0].propPath
    const ancestorComponent = Editor.parent(editor, ancestorComponentProp[1])
    if (ancestorComponent[0].type === 'component-block') {
      const component = ancestorComponent[0].component
      const componentBlock = componentBlocks[component]
      if (componentBlock && propPath) {
        const childField = getSchemaAtPropPath(
          propPath,
          ancestorComponent[0].props,
          componentBlock.schema
        )
        if (childField?.kind === 'child') {
          return getDocumentFeaturesForChildField(editorDocumentFeatures, childField.options)
        }
      }
    }
  }
}

export const createToolbarState = (
  editor: Editor,
  componentBlocks: Record<string, ComponentBlock>,
  editorDocumentFeatures: DocumentFeatures,
  selectionOverride?: any
): ToolbarState => {
  const locationDocumentFeatures: DocumentFeaturesForChildField =
    getAncestorComponentChildFieldDocumentFeatures(
      editor,
      editorDocumentFeatures,
      componentBlocks
    ) || {
      kind: 'block',
      inlineMarks: 'inherit',
      documentFeatures: {
        dividers: true,
        formatting: {
          alignment: { center: true, end: true },
          blockTypes: { blockquote: true, code: true },
          headingLevels: [1, 2, 3, 4, 5, 6],
          listTypes: { ordered: true, unordered: true },
        },
        layouts: editorDocumentFeatures.layouts,
        links: true,
        relationships: true,
      },
      softBreaks: true,
      componentBlocks: true,
    }

  const selection = selectionOverride ?? editor.selection
  const editorMarks = Editor.marks(editor) || {}
  const marks = Object.fromEntries(
    allMarks.map(mark => [
      mark,
      {
        isDisabled: false,
        isSelected: !!editorMarks[mark],
      },
    ])
  ) as ToolbarState['marks']

  if (selection && Range.isExpanded(selection)) {
    for (const node of Editor.nodes(editor, { at: selection, match: Text.isText })) {
      for (const key of Object.keys(node[0])) {
        if (key === 'insertMenu' || key === 'text') {
          continue
        }
        if (key in marks) {
          marks[key as Mark].isSelected = true
        }
      }
    }
  }

  const atSelection = selection ?? editor.selection

  const [headingEntry] = atSelection
    ? Editor.nodes(editor, {
        at: atSelection,
        match: nodeTypeMatcher('heading'),
      })
    : []

  const [listEntry] = atSelection
    ? Editor.nodes(editor, {
        at: atSelection,
        match: isListNode,
      })
    : []

  const [alignableEntry] = atSelection
    ? Editor.nodes(editor, {
        at: atSelection,
        match: nodeTypeMatcher('paragraph', 'heading'),
      })
    : []

  // (we're gonna use markdown here because the equivelant slate structure is quite large and doesn't add value here)
  // let's imagine a document that looks like this:
  // - thing
  //   1. something<cursor />
  // in the toolbar, you don't want to see that both ordered and unordered lists are selected
  // you want to see only ordered list selected, because
  // - you want to know what list you're actually in, you don't really care about the outer list
  // - when you want to change the list to a unordered list, the unordered list button should be inactive to show you can change to it
  const listTypeAbove = getListTypeAbove(editor, atSelection ?? null)

  return {
    marks,
    textStyles: {
      selected: headingEntry ? headingEntry[0].level : 'normal',
      allowedHeadingLevels:
        locationDocumentFeatures.kind === 'block' && !listEntry
          ? locationDocumentFeatures.documentFeatures.formatting.headingLevels
          : [],
    },
    relationships: { isDisabled: !locationDocumentFeatures.documentFeatures.relationships },
    code: {
      isSelected: isElementActive(editor, 'code', atSelection ?? null),
      isDisabled: !(
        locationDocumentFeatures.kind === 'block' &&
        locationDocumentFeatures.documentFeatures.formatting.blockTypes.code
      ),
    },
    lists: {
      ordered: {
        isSelected:
          isElementActive(editor, 'ordered-list', atSelection ?? null) &&
          (listTypeAbove === 'none' || listTypeAbove === 'ordered-list'),
        isDisabled: !(
          locationDocumentFeatures.kind === 'block' &&
          locationDocumentFeatures.documentFeatures.formatting.listTypes.ordered &&
          !headingEntry
        ),
      },
      unordered: {
        isSelected:
          isElementActive(editor, 'unordered-list', atSelection ?? null) &&
          (listTypeAbove === 'none' || listTypeAbove === 'unordered-list'),
        isDisabled: !(
          locationDocumentFeatures.kind === 'block' &&
          locationDocumentFeatures.documentFeatures.formatting.listTypes.unordered &&
          !headingEntry
        ),
      },
    },
    alignment: {
      isDisabled:
        !alignableEntry &&
        !(
          locationDocumentFeatures.kind === 'block' &&
          locationDocumentFeatures.documentFeatures.formatting.alignment
        ),
      selected: alignableEntry?.[0].textAlign || 'start',
    },
    blockquote: {
      isDisabled: !(
        locationDocumentFeatures.kind === 'block' &&
        locationDocumentFeatures.documentFeatures.formatting.blockTypes.blockquote
      ),
      isSelected: isElementActive(editor, 'blockquote', atSelection ?? null),
    },
    layouts: { isSelected: isElementActive(editor, 'layout', atSelection ?? null) },
    links: {
      isDisabled:
        !selection ||
        Range.isCollapsed(selection) ||
        !locationDocumentFeatures.documentFeatures.links,
      isSelected: isElementActive(editor, 'link', atSelection ?? null),
    },
    editor,
    dividers: {
      isDisabled:
        locationDocumentFeatures.kind === 'inline' ||
        !locationDocumentFeatures.documentFeatures.dividers,
    },
    clearFormatting: {
      isDisabled: !(
        Object.values(marks).some(x => x.isSelected) ||
        !!hasBlockThatClearsOnClearFormatting(editor, atSelection ?? null)
      ),
    },
    editorDocumentFeatures,
  }
}

function hasBlockThatClearsOnClearFormatting(editor: Editor, selection: Location | null) {
  if (selection === null) return false
  const at = selection ?? editor.selection
  if (!at) return false
  const [node] = Editor.nodes(editor, {
    at,
    match: node => node.type === 'heading' || node.type === 'code' || node.type === 'blockquote',
  })
  return !!node
}

export function getListTypeAbove(
  editor: Editor,
  selection: Location | null
): 'none' | 'ordered-list' | 'unordered-list' {
  if (selection === null) return 'none'
  const at = selection ?? editor.selection
  if (!at) return 'none'
  const listAbove = Editor.above(editor, { at, match: isListNode })
  if (!listAbove) {
    return 'none'
  }
  return listAbove[0].type
}
