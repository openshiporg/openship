export function withRelationship(editor) {
  const { isVoid, isInline } = editor
  editor.isVoid = element => (element.type === 'relationship' || isVoid(element))
  editor.isInline = element => (element.type === 'relationship' || isInline(element))
  return editor
}
