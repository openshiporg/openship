import { Editor } from  'slate'
import { insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading } from  './utils'

export function insertDivider (editor) {
  insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
    type: 'divider',
    children: [{ text: '' }],
  })
  Editor.insertNode(editor, { type: 'paragraph', children: [{ text: '' }] })
}

export function withDivider(editor) {
  const { isVoid } = editor
  editor.isVoid = node => {
    return node.type === 'divider' || isVoid(node);
  }
  return editor
}
