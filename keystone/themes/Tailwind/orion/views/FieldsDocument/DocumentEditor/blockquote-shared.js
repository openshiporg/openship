import { Editor, Node, Path, Range, Transforms } from  'slate'

import { isElementActive } from  './utils'

export function insertBlockquote (editor) {
  const isActive = isElementActive(editor, 'blockquote')
  if (isActive) {
    Transforms.unwrapNodes(editor, {
      match: node => node.type === 'blockquote',
    })
  } else {
    Transforms.wrapNodes(editor, {
      type: 'blockquote',
      children: [],
    })
  }
}

function getDirectBlockquoteParentFromSelection (editor) {
  if (!editor.selection) return {
    isInside: false
  };
  const [, parentPath] = Editor.parent(editor, editor.selection)
  if (!parentPath.length) {
    return {
      isInside: false
    };
  }
  const [maybeBlockquoteParent, maybeBlockquoteParentPath] = Editor.parent(editor, parentPath)
  const isBlockquote = maybeBlockquoteParent.type === 'blockquote'
  return isBlockquote
    ? ({
    isInside: true,
    path: maybeBlockquoteParentPath
  })
    : ({
    isInside: false
  });
}

export function withBlockquote(editor) {
  const { insertBreak, deleteBackward } = editor
  editor.deleteBackward = unit => {
    if (editor.selection) {
      const parentBlockquote = getDirectBlockquoteParentFromSelection(editor)
      if (
        parentBlockquote.isInside &&
        Range.isCollapsed(editor.selection) &&
        // the selection is at the start of the paragraph
        editor.selection.anchor.offset === 0 &&
        // it's the first paragraph in the panel
        editor.selection.anchor.path[editor.selection.anchor.path.length - 2] === 0
      ) {
        Transforms.unwrapNodes(editor, {
          match: node => node.type === 'blockquote',
          split: true,
        })
        return
      }
    }
    deleteBackward(unit)
  }
  editor.insertBreak = () => {
    const panel = getDirectBlockquoteParentFromSelection(editor)
    if (editor.selection && panel.isInside) {
      const [node, nodePath] = Editor.node(editor, editor.selection)
      if (Path.isDescendant(nodePath, panel.path) && Node.string(node) === '') {
        Transforms.unwrapNodes(editor, {
          match: node => node.type === 'blockquote',
          split: true,
        })
        return
      }
    }
    insertBreak()
  }

  return editor
}
