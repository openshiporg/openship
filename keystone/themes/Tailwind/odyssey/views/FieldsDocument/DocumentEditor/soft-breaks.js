import { Transforms } from "slate"

export function withSoftBreaks(editor) {
  // TODO: should soft breaks only work in particular places
  editor.insertSoftBreak = () => {
    Transforms.insertText(editor, "\n")
  }
  return editor
}
