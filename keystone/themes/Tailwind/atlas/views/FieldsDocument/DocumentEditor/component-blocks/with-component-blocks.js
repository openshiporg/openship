import { Editor, Element, Transforms, Range, Path, Node, Text } from "slate";

import weakMemoize from "@emotion/weak-memoize";
import { assert, moveChildren } from "../utils";
import {
  areArraysEqual,
  normalizeElementBasedOnDocumentFeatures,
  normalizeInlineBasedOnLinksAndRelationships,
  normalizeTextBasedOnInlineMarksAndSoftBreaks,
} from "../document-features-normalization";
import {
  assertNever,
  findChildPropPaths,
  getAncestorSchemas,
  getDocumentFeaturesForChildField,
  getValueAtPropPath,
  replaceValueAtPropPath,
  traverseProps,
} from "./utils";
import { getInitialPropsValue } from "./initial-values";
import {
  getKeysForArrayValue,
  getNewArrayElementKey,
  setKeysForArrayValue,
} from "./preview-props";

function getAncestorComponentBlock(editor) {
  if (editor.selection) {
    const ancestorEntry = Editor.above(editor, {
      match: (node) =>
        Editor.isBlock(editor, node) && node.type !== "paragraph",
    });
    if (
      ancestorEntry &&
      (ancestorEntry[0].type === "component-block-prop" ||
        ancestorEntry[0].type === "component-inline-prop")
    ) {
      return {
        isInside: true,
        componentBlock: Editor.parent(editor, ancestorEntry[1]),
        prop: ancestorEntry,
      };
    }
  }
  return {
    isInside: false,
  };
}

const alreadyNormalizedThings = new WeakMap();

function normalizeNodeWithinComponentProp(
  [node, path],
  editor,
  fieldOptions,
  relationships
) {
  let alreadyNormalizedNodes = alreadyNormalizedThings.get(fieldOptions);
  if (!alreadyNormalizedNodes) {
    alreadyNormalizedNodes = new WeakSet();
    alreadyNormalizedThings.set(fieldOptions, alreadyNormalizedNodes);
  }
  if (alreadyNormalizedNodes.has(node)) {
    return false;
  }
  let didNormalization = false;
  if (fieldOptions.inlineMarks !== "inherit" && Text.isText(node)) {
    didNormalization = normalizeTextBasedOnInlineMarksAndSoftBreaks(
      [node, path],
      editor,
      fieldOptions.inlineMarks,
      fieldOptions.softBreaks
    );
  }
  if (Element.isElement(node)) {
    let childrenHasChanged = node.children
      .map((node, i) =>
        normalizeNodeWithinComponentProp(
          [node, [...path, i]],
          editor,
          fieldOptions,
          relationships
        )
      )
      // .map then .some because we don't want to exit early
      .some((x) => x);
    if (fieldOptions.kind === "block") {
      didNormalization =
        normalizeElementBasedOnDocumentFeatures(
          [node, path],
          editor,
          fieldOptions.documentFeatures,
          relationships
        ) || childrenHasChanged;
    } else {
      didNormalization = normalizeInlineBasedOnLinksAndRelationships(
        [node, path],
        editor,
        fieldOptions.documentFeatures.links,
        fieldOptions.documentFeatures.relationships,
        relationships
      );
    }
  }

  if (didNormalization === false) {
    alreadyNormalizedNodes.add(node);
  }
  return didNormalization;
}

function canSchemaContainChildField(rootSchema) {
  const queue = new Set([rootSchema]);
  for (const schema of queue) {
    if (schema.kind === "form" || schema.kind === "relationship") {
    } else if (schema.kind === "child") {
      return true;
    } else if (schema.kind === "array") {
      queue.add(schema.element);
    } else if (schema.kind === "object") {
      for (const innerProp of Object.values(schema.fields)) {
        queue.add(innerProp);
      }
    } else if (schema.kind === "conditional") {
      for (const innerProp of Object.values(schema.values)) {
        queue.add(innerProp);
      }
    } else {
      assertNever(schema);
    }
  }
  return false;
}

function doesSchemaOnlyEverContainASingleChildField(rootSchema) {
  const queue = new Set([rootSchema]);
  let hasFoundChildField = false;
  for (const schema of queue) {
    if (schema.kind === "form" || schema.kind === "relationship") {
    } else if (schema.kind === "child") {
      if (hasFoundChildField) {
        return false;
      }
      hasFoundChildField = true;
    } else if (schema.kind === "array") {
      if (canSchemaContainChildField(schema.element)) {
        return false;
      }
    } else if (schema.kind === "object") {
      for (const innerProp of Object.values(schema.fields)) {
        queue.add(innerProp);
      }
    } else if (schema.kind === "conditional") {
      for (const innerProp of Object.values(schema.values)) {
        queue.add(innerProp);
      }
    } else {
      assertNever(schema);
    }
  }
  return hasFoundChildField;
}

function findArrayFieldsWithSingleChildField(schema, value) {
  const propPaths = [];
  traverseProps(schema, value, (schema, value, path) => {
    if (
      schema.kind === "array" &&
      doesSchemaOnlyEverContainASingleChildField(schema.element)
    ) {
      propPaths.push([path, schema]);
    }
  });
  return propPaths;
}

function isEmptyChildFieldNode(element) {
  const firstChild = element.children[0];
  return (
    element.children.length === 1 &&
    ((element.type === "component-inline-prop" &&
      firstChild.type === undefined &&
      firstChild.text === "") ||
      (element.type === "component-block-prop" &&
        firstChild.type === "paragraph" &&
        firstChild.children.length === 1 &&
        firstChild.children[0].type === undefined &&
        firstChild.children[0].text === ""))
  );
}

export function withComponentBlocks(
  blockComponents,
  editorDocumentFeatures,
  relationships,
  editor
) {
  // note that conflicts between the editor document features
  // and the child field document features are dealt with elsewhere
  const memoizedGetDocumentFeaturesForChildField = weakMemoize((options) => {
    return getDocumentFeaturesForChildField(editorDocumentFeatures, options);
  });
  const { normalizeNode, deleteBackward, insertBreak } = editor;
  editor.deleteBackward = (unit) => {
    if (editor.selection) {
      const ancestorComponentBlock = getAncestorComponentBlock(editor);
      if (
        ancestorComponentBlock.isInside &&
        Range.isCollapsed(editor.selection) &&
        Editor.isStart(
          editor,
          editor.selection.anchor,
          ancestorComponentBlock.prop[1]
        ) &&
        ancestorComponentBlock.prop[1][
          ancestorComponentBlock.prop[1].length - 1
        ] === 0
      ) {
        Transforms.unwrapNodes(editor, {
          at: ancestorComponentBlock.componentBlock[1],
        });
        return;
      }
    }
    deleteBackward(unit);
  };
  editor.insertBreak = () => {
    const ancestorComponentBlock = getAncestorComponentBlock(editor);
    if (editor.selection && ancestorComponentBlock.isInside) {
      const {
        prop: [componentPropNode, componentPropPath],
        componentBlock: [componentBlockNode, componentBlockPath],
      } = ancestorComponentBlock;
      const isLastProp =
        componentPropPath[componentPropPath.length - 1] ===
        componentBlockNode.children.length - 1;

      if (componentPropNode.type === "component-block-prop") {
        const [[paragraphNode, paragraphPath]] = Editor.nodes(editor, {
          match: (node) => node.type === "paragraph",
        });
        const isLastParagraph =
          paragraphPath[paragraphPath.length - 1] ===
          componentPropNode.children.length - 1;
        if (Node.string(paragraphNode) === "" && isLastParagraph) {
          if (isLastProp) {
            Transforms.moveNodes(editor, {
              at: paragraphPath,
              to: Path.next(ancestorComponentBlock.componentBlock[1]),
            });
          } else {
            Transforms.move(editor, { distance: 1, unit: "line" });
            Transforms.removeNodes(editor, { at: paragraphPath });
          }
          return;
        }
      }
      if (componentPropNode.type === "component-inline-prop") {
        Editor.withoutNormalizing(editor, () => {
          const componentBlock = blockComponents[componentBlockNode.component];
          if (
            componentPropNode.propPath !== undefined &&
            componentBlock !== undefined
          ) {
            const rootSchema = {
              kind: "object",
              fields: componentBlock.schema,
            };
            const ancestorFields = getAncestorSchemas(
              rootSchema,
              componentPropNode.propPath,
              componentBlockNode.props
            );
            const idx = [...ancestorFields]
              .reverse()
              .findIndex((item) => item.kind === "array");
            if (idx !== -1) {
              const arrayFieldIdx = ancestorFields.length - 1 - idx;
              const arrayField = ancestorFields[arrayFieldIdx];
              assert(arrayField.kind === "array");
              const val = getValueAtPropPath(
                componentBlockNode.props,
                componentPropNode.propPath.slice(0, arrayFieldIdx)
              );
              if (
                doesSchemaOnlyEverContainASingleChildField(arrayField.element)
              ) {
                if (
                  Node.string(componentPropNode) === "" &&
                  val.length - 1 === componentPropNode.propPath[arrayFieldIdx]
                ) {
                  Transforms.removeNodes(editor, { at: componentPropPath });
                  if (isLastProp) {
                    Transforms.insertNodes(
                      editor,
                      { type: "paragraph", children: [{ text: "" }] },
                      { at: Path.next(componentBlockPath) }
                    );
                    Transforms.select(editor, Path.next(componentBlockPath));
                  } else {
                    Transforms.move(editor, { distance: 1, unit: "line" });
                  }
                } else {
                  insertBreak();
                }
                return;
              }
            }
          }

          Transforms.splitNodes(editor, { always: true });
          const splitNodePath = Path.next(componentPropPath);

          if (isLastProp) {
            Transforms.moveNodes(editor, {
              at: splitNodePath,
              to: Path.next(componentBlockPath),
            });
          } else {
            moveChildren(editor, splitNodePath, [
              ...Path.next(splitNodePath),
              0,
            ]);
            Transforms.removeNodes(editor, { at: splitNodePath });
          }
        });
        return;
      }
    }
    insertBreak();
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (
      node.type === "component-inline-prop" &&
      !node.propPath &&
      (node.children.length !== 1 ||
        !Text.isText(node.children[0]) ||
        node.children[0].text !== "")
    ) {
      Transforms.removeNodes(editor, {
        at: path,
      });
      return;
    }

    if (node.type === "component-block") {
      const componentBlock = blockComponents[node.component];
      if (componentBlock) {
        const rootSchema = {
          kind: "object",
          fields: componentBlock.schema,
        };

        const updatedProps = addMissingFields(node.props, rootSchema);
        if (updatedProps !== node.props) {
          Transforms.setNodes(editor, { props: updatedProps }, { at: path });
          return;
        }

        for (const [
          propPath,
          arrayField,
        ] of findArrayFieldsWithSingleChildField(rootSchema, node.props)) {
          if (
            node.children.length === 1 &&
            node.children[0].type === "component-inline-prop" &&
            node.children[0].propPath === undefined
          ) {
            break;
          }
          const nodesWithin = [];
          for (const [idx, childNode] of node.children.entries()) {
            if (
              (childNode.type === "component-block-prop" ||
                childNode.type === "component-inline-prop") &&
              childNode.propPath !== undefined
            ) {
              const subPath = childNode.propPath.concat();
              while (subPath.length) {
                if (typeof subPath.pop() === "number") break;
              }

              if (areArraysEqual(propPath, subPath)) {
                nodesWithin.push([idx, childNode]);
              }
            }
          }
          const arrVal = getValueAtPropPath(node.props, propPath);
          const prevKeys = getKeysForArrayValue(arrVal);
          const prevKeysSet = new Set(prevKeys);
          const alreadyUsedIndicies = new Set();
          const newVal = [];
          const newKeys = [];
          const getNewKey = () => {
            let key = getNewArrayElementKey();
            while (prevKeysSet.has(key)) {
              key = getNewArrayElementKey();
            }
            return key;
          };
          for (const [, node] of nodesWithin) {
            const idxFromValue = node.propPath[propPath.length];
            assert(typeof idxFromValue === "number");
            if (
              arrVal.length <= idxFromValue ||
              (alreadyUsedIndicies.has(idxFromValue) &&
                isEmptyChildFieldNode(node))
            ) {
              newVal.push(getInitialPropsValue(arrayField.element));
              newKeys.push(getNewKey());
            } else {
              alreadyUsedIndicies.add(idxFromValue);
              newVal.push(arrVal[idxFromValue]);
              newKeys.push(
                alreadyUsedIndicies.has(idxFromValue)
                  ? getNewKey()
                  : prevKeys[idxFromValue]
              );
            }
          }
          setKeysForArrayValue(newVal, newKeys);
          if (!areArraysEqual(arrVal, newVal)) {
            const transformedProps = replaceValueAtPropPath(
              rootSchema,
              node.props,
              newVal,
              propPath
            );
            Transforms.setNodes(
              editor,
              { props: transformedProps },
              { at: path }
            );
            for (const [
              idx,
              [idxInChildrenOfBlock, nodeWithin],
            ] of nodesWithin.entries()) {
              const newPropPath = [...nodeWithin.propPath];
              newPropPath[propPath.length] = idx;
              Transforms.setNodes(
                editor,
                { propPath: newPropPath },
                { at: [...path, idxInChildrenOfBlock] }
              );
            }
            return;
          }
        }

        const missingKeys = new Map(
          findChildPropPaths(node.props, componentBlock.schema).map((x) => [
            JSON.stringify(x.path),
            x.options.kind,
          ])
        );

        node.children.forEach((node) => {
          assert(
            node.type === "component-block-prop" ||
              node.type === "component-inline-prop"
          );
          missingKeys.delete(JSON.stringify(node.propPath));
        });
        if (missingKeys.size) {
          Transforms.insertNodes(
            editor,
            [...missingKeys].map(([prop, kind]) => ({
              type: `component-${kind}-prop`,
              propPath: prop ? JSON.parse(prop) : prop,
              children: [{ text: "" }],
            })),
            { at: [...path, node.children.length] }
          );
          return;
        }

        const foundProps = new Set();

        const stringifiedInlinePropPaths = {};
        findChildPropPaths(
          node.props,
          blockComponents[node.component].schema
        ).forEach((x, index) => {
          stringifiedInlinePropPaths[JSON.stringify(x.path)] = {
            options: x.options,
            index,
          };
        });

        for (const [index, childNode] of node.children.entries()) {
          if (
            // children that are not these will be handled by
            // the generic allowedChildren normalization
            childNode.type !== "component-inline-prop" &&
            childNode.type !== "component-block-prop"
          ) {
            continue;
          }

          const childPath = [...path, index];
          const stringifiedPropPath = JSON.stringify(childNode.propPath);
          if (stringifiedInlinePropPaths[stringifiedPropPath] === undefined) {
            Transforms.removeNodes(editor, { at: childPath });
            return;
          }

          if (foundProps.has(stringifiedPropPath)) {
            Transforms.removeNodes(editor, { at: childPath });
            return;
          }

          foundProps.add(stringifiedPropPath);
          const propInfo = stringifiedInlinePropPaths[stringifiedPropPath];
          const expectedIndex = propInfo.index;
          if (index !== expectedIndex) {
            Transforms.moveNodes(editor, {
              at: childPath,
              to: [...path, expectedIndex],
            });
            return;
          }

          const expectedChildNodeType = `component-${propInfo.options.kind}-prop`;
          if (childNode.type !== expectedChildNodeType) {
            Transforms.setNodes(
              editor,
              { type: expectedChildNodeType },
              { at: childPath }
            );
            return;
          }

          const documentFeatures = memoizedGetDocumentFeaturesForChildField(
            propInfo.options
          );
          if (
            normalizeNodeWithinComponentProp(
              [childNode, childPath],
              editor,
              documentFeatures,
              relationships
            )
          ) {
            return;
          }
        }
      }
    }

    normalizeNode(entry);
  };

  return editor;
}

// the only thing that this will fix is a new field being added to an object field, nothing else.
function addMissingFields(value, schema) {
  if (
    schema.kind === "child" ||
    schema.kind === "form" ||
    schema.kind === "relationship"
  ) {
    return value;
  }
  if (schema.kind === "conditional") {
    const conditionalValue = value;
    const updatedInnerValue = addMissingFields(
      conditionalValue.value,
      schema.values[conditionalValue.discriminant.toString()]
    );
    if (updatedInnerValue === conditionalValue.value) {
      return value;
    }
    return {
      discriminant: conditionalValue.discriminant,
      value: updatedInnerValue,
    };
  }
  if (schema.kind === "array") {
    const arrValue = value;
    const newArrValue = arrValue.map((x) =>
      addMissingFields(x, schema.element)
    );
    if (areArraysEqual(arrValue, newArrValue)) {
      return value;
    }
    return newArrValue;
  }
  if (schema.kind === "object") {
    const objectValue = value;
    let hasChanged = false;
    const newObjectValue = {};
    for (const [key, innerSchema] of Object.entries(schema.fields)) {
      const innerValue = objectValue[key];
      if (innerValue === undefined) {
        hasChanged = true;
        newObjectValue[key] = getInitialPropsValue(innerSchema);
        continue;
      }
      const newInnerValue = addMissingFields(innerValue, innerSchema);
      if (newInnerValue !== innerValue) {
        hasChanged = true;
      }
      newObjectValue[key] = newInnerValue;
    }
    if (hasChanged) {
      return newObjectValue;
    }
    return value;
  }
  assertNever(schema);
}
