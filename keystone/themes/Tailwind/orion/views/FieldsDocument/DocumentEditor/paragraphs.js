import { Editor, Transforms } from  'slate'

export const paragraphElement = () => ({
  type: "paragraph",
  children: [{ text: '' }],
})

export function withParagraphs(editor) {
  const { normalizeNode } = editor

  editor.normalizeNode = entry => {
    const [node, path] = entry

    if (Editor.isEditor(node)) {
      const lastNode = node.children[node.children.length - 1]
      if (lastNode?.type !== 'paragraph') {
        Transforms.insertNodes(editor, paragraphElement(), {
          at: [...path, node.children.length],
        })
        return
      }
    }

    normalizeNode(entry)
  }

  return editor
}
