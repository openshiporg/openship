import { Text, Transforms, Element, Editor, Node } from "slate"

export function areArraysEqual(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

export function normalizeTextBasedOnInlineMarksAndSoftBreaks(
  [node, path],
  editor,
  inlineMarks,
  softBreaks
) {
  const marksToRemove = Object.keys(node).filter(
    x => x !== "text" && x !== "insertMenu" && inlineMarks[x] !== true
  )
  if (marksToRemove.length) {
    Transforms.unsetNodes(editor, marksToRemove, { at: path })
    return true
  }
  if (!softBreaks) {
    const hasSoftBreaks = node.text.includes("\n")
    if (hasSoftBreaks) {
      const [parentNode] = Editor.parent(editor, path)
      if (parentNode.type !== "code") {
        for (const position of Editor.positions(editor, { at: path })) {
          const character = Node.get(editor, position.path).text[
            position.offset
          ]
          if (character === "\n") {
            Transforms.delete(editor, { at: position })
            return true
          }
        }
      }
    }
  }

  return false
}

export function normalizeInlineBasedOnLinksAndRelationships(
  [node, path],
  editor,
  links,
  relationshipsEnabled,
  relationships
) {
  if (node.type === "link" && !links) {
    Transforms.insertText(editor, ` (${node.href})`, {
      at: Editor.end(editor, path)
    })
    Transforms.unwrapNodes(editor, { at: path })
    return true
  }
  if (
    node.type === "relationship" &&
    (!relationshipsEnabled || relationships[node.relationship] === undefined)
  ) {
    const data = node.data
    if (data) {
      const relationship = relationships[node.relationship]
      Transforms.insertText(
        editor,
        `${data.label || data.id || ""} (${relationship?.label ||
          node.relationship}:${data.id || ""})`,
        { at: Editor.before(editor, path) }
      )
    }
    Transforms.removeNodes(editor, { at: path })
    return true
  }
  return false
}

export function normalizeElementBasedOnDocumentFeatures(
  [node, path],
  editor,
  { formatting, dividers, layouts, links, relationships: relationshipsEnabled },
  relationships
) {
  if (
    (node.type === "heading" &&
      (!formatting.headingLevels.length ||
        !formatting.headingLevels.includes(node.level))) ||
    (node.type === "ordered-list" && !formatting.listTypes.ordered) ||
    (node.type === "unordered-list" && !formatting.listTypes.unordered) ||
    (node.type === "code" && !formatting.blockTypes.code) ||
    (node.type === "blockquote" && !formatting.blockTypes.blockquote) ||
    (node.type === "layout" &&
      (layouts.length === 0 ||
        !layouts.some(layout => areArraysEqual(layout, node.layout))))
  ) {
    Transforms.unwrapNodes(editor, { at: path })
    return true
  }
  if (
    (node.type === "paragraph" || node.type === "heading") &&
    ((!formatting.alignment.center && node.textAlign === "center") ||
      (!formatting.alignment.end && node.textAlign === "end") ||
      ("textAlign" in node &&
        node.textAlign !== "center" &&
        node.textAlign !== "end"))
  ) {
    Transforms.unsetNodes(editor, "textAlign", { at: path })
    return true
  }
  if (node.type === "divider" && !dividers) {
    Transforms.removeNodes(editor, { at: path })
    return true
  }

  return normalizeInlineBasedOnLinksAndRelationships(
    [node, path],
    editor,
    links,
    relationshipsEnabled,
    relationships
  )
}

export function withDocumentFeaturesNormalization(
  documentFeatures,
  relationships,
  editor
) {
  const { normalizeNode } = editor
  const documentFeaturesForNormalization = {
    ...documentFeatures,
    relationships: true
  }
  editor.normalizeNode = ([node, path]) => {
    if (Text.isText(node)) {
      normalizeTextBasedOnInlineMarksAndSoftBreaks(
        [node, path],
        editor,
        documentFeatures.formatting.inlineMarks,
        documentFeatures.formatting.softBreaks
      )
    } else if (Element.isElement(node)) {
      normalizeElementBasedOnDocumentFeatures(
        [node, path],
        editor,
        documentFeaturesForNormalization,
        relationships
      )
    }
    normalizeNode([node, path])
  }
  return editor
}
