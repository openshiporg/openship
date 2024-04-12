import * as t from "io-ts"
import excess from "io-ts-excess"
import { isValidURL } from "./DocumentEditor/isValidURL"
// note that this validation isn't about ensuring that a document has nodes in the right positions and things
// it's just about validating that it's a valid slate structure
// we'll then run normalize on it which will enforce more things
const markValue = t.union([t.undefined, t.literal(true)])

const text = excess(
  t.type({
    text: t.string,
    bold: markValue,
    italic: markValue,
    underline: markValue,
    strikethrough: markValue,
    code: markValue,
    superscript: markValue,
    subscript: markValue,
    keyboard: markValue,
    insertMenu: markValue
  })
)

class URLType extends t.Type {
  _tag = "URLType"
  constructor() {
    super(
      "string",
      u => typeof u === "string" && isValidURL(u),
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity
    )
  }
}

const urlType = new URLType()

const link = t.recursion("Link", () =>
  excess(
    t.type({
      type: t.literal("link"),
      href: urlType,
      children
    })
  )
)

const relationship = t.recursion("Relationship", () =>
  excess(
    t.type({
      type: t.literal("relationship"),
      relationship: t.string,
      data: t.union([t.null, relationshipData]),
      children
    })
  )
)

const inline = t.union([text, link, relationship])

const layoutArea = t.recursion("Layout", () =>
  excess(
    t.type({
      type: t.literal("layout"),
      layout: t.array(t.number),
      children
    })
  )
)

const onlyChildrenElements = t.recursion("OnlyChildrenElements", () =>
  excess(
    t.type({
      type: t.union([
        t.literal("blockquote"),
        t.literal("layout-area"),
        t.literal("code"),
        t.literal("divider"),
        t.literal("list-item"),
        t.literal("list-item-content"),
        t.literal("ordered-list"),
        t.literal("unordered-list")
      ]),
      children
    })
  )
)

const textAlign = t.union([t.undefined, t.literal("center"), t.literal("end")])

const heading = t.recursion("Heading", () =>
  excess(
    t.type({
      type: t.literal("heading"),
      textAlign,
      level: t.union([
        t.literal(1),
        t.literal(2),
        t.literal(3),
        t.literal(4),
        t.literal(5),
        t.literal(6)
      ]),
      children
    })
  )
)

const paragraph = t.recursion("Paragraph", () =>
  excess(
    t.type({
      type: t.literal("paragraph"),
      textAlign,
      children
    })
  )
)

const relationshipData = excess(
  t.type({
    id: t.string,
    label: t.union([t.undefined, t.string]),
    data: t.union([t.undefined, t.record(t.string, t.any)])
  })
)

const componentBlock = t.recursion("ComponentBlock", () =>
  excess(
    t.type({
      type: t.literal("component-block"),
      component: t.string,
      props: t.record(t.string, t.any),
      children
    })
  )
)

const componentProp = t.recursion("ComponentProp", () =>
  excess(
    t.type({
      type: t.union([
        t.literal("component-inline-prop"),
        t.literal("component-block-prop")
      ]),
      propPath: t.union([t.array(t.union([t.string, t.number])), t.undefined]),
      children
    })
  )
)

const block = t.recursion("Element", () =>
  t.union([
    layoutArea,
    onlyChildrenElements,
    heading,
    componentBlock,
    componentProp,
    paragraph
  ])
)

const children = t.recursion("Children", () =>
  t.array(t.union([block, inline]))
)

export const editorCodec = t.array(block)

export function isRelationshipData(val) {
  return relationshipData.validate(val, [])._tag === "Right"
}

export function validateDocumentStructure(val) {
  const result = editorCodec.validate(val, [])
  if (result._tag === "Left") {
    throw new Error("Invalid document structure")
  }
}
