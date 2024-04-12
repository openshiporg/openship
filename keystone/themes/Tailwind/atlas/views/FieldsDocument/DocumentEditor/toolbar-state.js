import React, { useContext } from "react";
import { Editor, Range, Text } from "slate";
import { useSlate } from "slate-react";
import { ComponentBlockContext } from "./component-blocks";
import {
  getSchemaAtPropPath,
  getDocumentFeaturesForChildField,
} from "./component-blocks/utils";
import { LayoutOptionsProvider } from "./layouts";
import { isListNode } from "./lists";
import { DocumentFieldRelationshipsProvider } from "./relationship";
import { allMarks, isElementActive, nodeTypeMatcher } from "./utils";

const ToolbarStateContext = React.createContext(null);

export function useToolbarState() {
  const toolbarState = useContext(ToolbarStateContext);
  if (!toolbarState) {
    throw new Error("ToolbarStateProvider must be used to use useToolbarState");
  }
  return toolbarState;
}

export function getAncestorComponentChildFieldDocumentFeatures(
  editor,
  editorDocumentFeatures,
  componentBlocks
) {
  const ancestorComponentProp = Editor.above(editor, {
    match: nodeTypeMatcher("component-block-prop", "component-inline-prop"),
  });

  if (ancestorComponentProp) {
    const propPath = ancestorComponentProp[0].propPath;
    const ancestorComponent = Editor.parent(editor, ancestorComponentProp[1]);
    if (ancestorComponent[0].type === "component-block") {
      const component = ancestorComponent[0].component;
      const componentBlock = componentBlocks[component];
      if (componentBlock && propPath) {
        const childField = getSchemaAtPropPath(
          propPath,
          ancestorComponent[0].props,
          componentBlock.schema
        );
        if (childField?.kind === "child") {
          return getDocumentFeaturesForChildField(
            editorDocumentFeatures,
            childField.options
          );
        }
      }
    }
  }
}

export const createToolbarState = (
  editor,
  componentBlocks,
  editorDocumentFeatures
) => {
  const locationDocumentFeatures =
    getAncestorComponentChildFieldDocumentFeatures(
      editor,
      editorDocumentFeatures,
      componentBlocks
    ) || {
      kind: "block",
      inlineMarks: "inherit",
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
    };

  let [maybeCodeBlockEntry] = Editor.nodes(editor, {
    match: (node) => node.type !== "code" && Editor.isBlock(editor, node),
  });
  const editorMarks = Editor.marks(editor) || {};
  const marks = Object.fromEntries(
    allMarks.map((mark) => [
      mark,
      {
        isDisabled:
          (locationDocumentFeatures.inlineMarks !== "inherit" &&
            !locationDocumentFeatures.inlineMarks[mark]) ||
          !maybeCodeBlockEntry,
        isSelected: !!editorMarks[mark],
      },
    ])
  );

  // Editor.marks is "what are the marks that would be applied if text was inserted now"
  // that's not really the UX we want, if we have some a document like this
  // <paragraph>
  //   <text>
  //     <anchor />
  //     content
  //   </text>
  //   <text bold>bold</text>
  //   <text>
  //     content
  //     <focus />
  //   </text>
  // </paragraph>

  // we want bold to be shown as selected even though if you inserted text from that selection, it wouldn't be bold
  // so we look at all the text nodes in the selection to get their marks
  // but only if the selection is expanded because if you're in the middle of some text
  // with your selection collapsed with a mark but you've removed it(i.e. editor.removeMark)
  // the text nodes you're in will have the mark but the ui should show the mark as not being selected
  if (editor.selection && Range.isExpanded(editor.selection)) {
    for (const node of Editor.nodes(editor, { match: Text.isText })) {
      for (const key of Object.keys(node[0])) {
        if (key === "insertMenu" || key === "text") {
          continue;
        }
        if (key in marks) {
          marks[key].isSelected = true;
        }
      }
    }
  }

  let [headingEntry] = Editor.nodes(editor, {
    match: nodeTypeMatcher("heading"),
  });

  let [listEntry] = Editor.nodes(editor, {
    match: isListNode,
  });

  let [alignableEntry] = Editor.nodes(editor, {
    match: nodeTypeMatcher("paragraph", "heading"),
  });

  // (we're gonna use markdown here because the equivelant slate structure is quite large and doesn't add value here)
  // let's imagine a document that looks like this:
  // - thing
  //   1. something<cursor />
  // in the toolbar, you don't want to see that both ordered and unordered lists are selected
  // you want to see only ordered list selected, because
  // - you want to know what list you're actually in, you don't really care about the outer list
  // - when you want to change the list to a unordered list, the unordered list button should be inactive to show you can change to it
  const listTypeAbove = getListTypeAbove(editor);

  return {
    marks,
    textStyles: {
      selected: headingEntry ? headingEntry[0].level : "normal",
      allowedHeadingLevels:
        locationDocumentFeatures.kind === "block" && !listEntry
          ? locationDocumentFeatures.documentFeatures.formatting.headingLevels
          : [],
    },
    relationships: {
      isDisabled: !locationDocumentFeatures.documentFeatures.relationships,
    },
    code: {
      isSelected: isElementActive(editor, "code"),
      isDisabled: !(
        locationDocumentFeatures.kind === "block" &&
        locationDocumentFeatures.documentFeatures.formatting.blockTypes.code
      ),
    },
    lists: {
      ordered: {
        isSelected:
          isElementActive(editor, "ordered-list") &&
          (listTypeAbove === "none" || listTypeAbove === "ordered-list"),
        isDisabled: !(
          locationDocumentFeatures.kind === "block" &&
          locationDocumentFeatures.documentFeatures.formatting.listTypes
            .ordered &&
          !headingEntry
        ),
      },
      unordered: {
        isSelected:
          isElementActive(editor, "unordered-list") &&
          (listTypeAbove === "none" || listTypeAbove === "unordered-list"),
        isDisabled: !(
          locationDocumentFeatures.kind === "block" &&
          locationDocumentFeatures.documentFeatures.formatting.listTypes
            .unordered &&
          !headingEntry
        ),
      },
    },
    alignment: {
      isDisabled:
        !alignableEntry &&
        !(
          locationDocumentFeatures.kind === "block" &&
          locationDocumentFeatures.documentFeatures.formatting.alignment
        ),
      selected: alignableEntry?.[0].textAlign || "start",
    },
    blockquote: {
      isDisabled: !(
        locationDocumentFeatures.kind === "block" &&
        locationDocumentFeatures.documentFeatures.formatting.blockTypes
          .blockquote
      ),
      isSelected: isElementActive(editor, "blockquote"),
    },
    layouts: { isSelected: isElementActive(editor, "layout") },
    links: {
      isDisabled:
        !editor.selection ||
        Range.isCollapsed(editor.selection) ||
        !locationDocumentFeatures.documentFeatures.links,
      isSelected: isElementActive(editor, "link"),
    },
    editor,
    dividers: {
      isDisabled:
        locationDocumentFeatures.kind === "inline" ||
        !locationDocumentFeatures.documentFeatures.dividers,
    },
    clearFormatting: {
      isDisabled: !(
        Object.values(marks).some((x) => x.isSelected) ||
        !!hasBlockThatClearsOnClearFormatting(editor)
      ),
    },
    editorDocumentFeatures,
  };
};

function hasBlockThatClearsOnClearFormatting(editor) {
  const [node] = Editor.nodes(editor, {
    match: (node) =>
      node.type === "heading" ||
      node.type === "code" ||
      node.type === "blockquote",
  });
  return !!node;
}

export function getListTypeAbove(editor) {
  const listAbove = Editor.above(editor, { match: isListNode });
  if (!listAbove) {
    return "none";
  }
  return listAbove[0].type;
}

export const ToolbarStateProvider = ({
  children,
  componentBlocks,
  editorDocumentFeatures,
  relationships,
}) => {
  const editor = useSlate();

  return (
    <DocumentFieldRelationshipsProvider value={relationships}>
      <LayoutOptionsProvider value={editorDocumentFeatures.layouts}>
        <ComponentBlockContext.Provider value={componentBlocks}>
          <ToolbarStateContext.Provider
            value={createToolbarState(
              editor,
              componentBlocks,
              editorDocumentFeatures
            )}
          >
            {children}
          </ToolbarStateContext.Provider>
        </ComponentBlockContext.Provider>
      </LayoutOptionsProvider>
    </DocumentFieldRelationshipsProvider>
  );
};
