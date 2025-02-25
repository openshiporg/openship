import { Editor, Text } from  'slate'

import weakMemoize from '@emotion/weak-memoize'
import { createDocumentEditor } from  './DocumentEditor/editor-shared'
import { clientSideValidateProp } from  './DocumentEditor/component-blocks/utils'
import { isValidURL } from  './DocumentEditor/isValidURL'

export function controller(config) {
  const memoizedIsComponentBlockValid = weakMemoize((componentBlock) =>
    weakMemoize((props) =>
      clientSideValidateProp({ kind: 'object', fields: componentBlock.schema }, props)))
  const componentBlocks = config.customViews.componentBlocks || {}
  const serverSideComponentBlocksSet = new Set(config.fieldMeta.componentBlocksPassedOnServer)
  const componentBlocksOnlyBeingPassedOnTheClient = Object.keys(componentBlocks).filter(x => !serverSideComponentBlocksSet.has(x))
  if (componentBlocksOnlyBeingPassedOnTheClient.length) {
    throw new Error(`(${config.listKey}:${
      config.path
    }) The following component blocks are being passed in the custom view but not in the server-side field config: ${JSON.stringify(componentBlocksOnlyBeingPassedOnTheClient)}`)
  }
  const clientSideComponentBlocksSet = new Set(Object.keys(componentBlocks))
  const componentBlocksOnlyBeingPassedOnTheServer =
    config.fieldMeta.componentBlocksPassedOnServer.filter(x => !clientSideComponentBlocksSet.has(x))
  if (componentBlocksOnlyBeingPassedOnTheServer.length) {
    throw new Error(`(${config.listKey}:${
      config.path
    }) The following component blocks are being passed in the server-side field config but not in the custom view: ${JSON.stringify(componentBlocksOnlyBeingPassedOnTheServer)}`)
  }
  const validateNode = weakMemoize(node => {
    if (Text.isText(node)) {
      return true
    }
    if (node.type === 'component-block') {
      const componentBlock = componentBlocks[node.component]
      if (componentBlock) {
        if (!memoizedIsComponentBlockValid(componentBlock)(node.props)) {
          return false
        }
      }
    }
    if (node.type === 'link' && (typeof node.href !== 'string' || !isValidURL(node.href))) {
      return false
    }
    return node.children.every(node => validateNode(node));
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
    deserialize: data => {
      const documentFromServer = data[config.path]?.document
      if (!documentFromServer) {
        return [{ type: 'paragraph', children: [{ text: '' }] }]
      }
      // make a temporary editor to normalize the document
      const editor = createDocumentEditor(
        config.fieldMeta.documentFeatures,
        componentBlocks,
        config.fieldMeta.relationships
      )
      editor.children = documentFromServer
      Editor.normalize(editor, { force: true })
      return editor.children
    },
    serialize: value => ({
      [config.path]: value,
    }),
    validate (value) {
      return value.every(node => validateNode(node));
    },
  };
}
