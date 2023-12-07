import { Editor, Node, Text } from "slate";
import { DocumentRenderer } from "@keystone-6/document-renderer";

import weakMemoize from "@emotion/weak-memoize";
import { CellContainer, CellLink } from "@keystone-6/core/admin-ui/components";
import { createDocumentEditor, DocumentEditor } from "./DocumentEditor";
import { clientSideValidateProp } from "./DocumentEditor/component-blocks/utils";
import { ForceValidationProvider } from "./DocumentEditor/utils";
import { isValidURL } from "./DocumentEditor/isValidURL";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { FieldLabel } from "@keystone/components/FieldLabel";

export const Field = ({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
}) => (
  <FieldContainer>
    <FieldLabel as="span" id={`${field.path}-label`}>
      {field.label}
    </FieldLabel>
    <FieldDescription id={`${field.path}-description`}>
      {field.description}
    </FieldDescription>
    <ForceValidationProvider value={!!forceValidation}>
      <DocumentEditor
        autoFocus={autoFocus}
        aria-labelledby={`${field.path}-label`}
        value={value}
        onChange={onChange}
        componentBlocks={field.componentBlocks}
        relationships={field.relationships}
        documentFeatures={field.documentFeatures}
      />
    </ForceValidationProvider>
  </FieldContainer>
);

const serialize = (nodes) => {
  return nodes.map((n) => Node.string(n)).join("\n");
};

export const Cell = ({ item, field, linkTo }) => {
  const value = item[field.path]?.document;
  if (!value) return null;
  const plainText = serialize(value);
  const cutText =
    plainText.length > 100 ? plainText.slice(0, 100) + "..." : plainText;
  return linkTo ? (
    <CellLink {...linkTo}>{cutText}</CellLink>
  ) : (
    <CellContainer>{cutText}</CellContainer>
  );
};
Cell.supportsLinkTo = true;

export const CardValue = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <DocumentRenderer document={item[field.path]?.document || []} />
    </FieldContainer>
  );
};

export const allowedExportsOnCustomViews = ["componentBlocks"];

export const controller = (config) => {
  const memoizedIsComponentBlockValid = weakMemoize((componentBlock) =>
    weakMemoize((props) =>
      clientSideValidateProp(
        { kind: "object", fields: componentBlock.schema },
        props
      )
    )
  );
  const componentBlocks = config.customViews.componentBlocks || {};
  const serverSideComponentBlocksSet = new Set(
    config.fieldMeta.componentBlocksPassedOnServer
  );
  const componentBlocksOnlyBeingPassedOnTheClient = Object.keys(
    componentBlocks
  ).filter((x) => !serverSideComponentBlocksSet.has(x));
  if (componentBlocksOnlyBeingPassedOnTheClient.length) {
    throw new Error(
      `(${config.listKey}:${
        config.path
      }) The following component blocks are being passed in the custom view but not in the server-side field config: ${JSON.stringify(
        componentBlocksOnlyBeingPassedOnTheClient
      )}`
    );
  }
  const clientSideComponentBlocksSet = new Set(Object.keys(componentBlocks));
  const componentBlocksOnlyBeingPassedOnTheServer =
    config.fieldMeta.componentBlocksPassedOnServer.filter(
      (x) => !clientSideComponentBlocksSet.has(x)
    );
  if (componentBlocksOnlyBeingPassedOnTheServer.length) {
    throw new Error(
      `(${config.listKey}:${
        config.path
      }) The following component blocks are being passed in the server-side field config but not in the custom view: ${JSON.stringify(
        componentBlocksOnlyBeingPassedOnTheServer
      )}`
    );
  }
  const validateNode = weakMemoize((node) => {
    if (Text.isText(node)) {
      return true;
    }
    if (node.type === "component-block") {
      const componentBlock = componentBlocks[node.component];
      if (componentBlock) {
        if (!memoizedIsComponentBlockValid(componentBlock)(node.props)) {
          return false;
        }
      }
    }
    if (
      node.type === "link" &&
      (typeof node.href !== "string" || !isValidURL(node.href))
    ) {
      return false;
    }
    return node.children.every((node) => validateNode(node));
  });
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} {document(hydrateRelationships: true)}`,
    componentBlocks: config.customViews.componentBlocks || {},
    documentFeatures: config.fieldMeta.documentFeatures,
    relationships: config.fieldMeta.relationships,
    defaultValue: [{ type: "paragraph", children: [{ text: "" }] }],
    deserialize: (data) => {
      const documentFromServer = data[config.path]?.document;
      if (!documentFromServer) {
        return [{ type: "paragraph", children: [{ text: "" }] }];
      }
      // make a temporary editor to normalize the document
      const editor = createDocumentEditor(
        config.fieldMeta.documentFeatures,
        componentBlocks,
        config.fieldMeta.relationships
      );
      editor.children = documentFromServer;
      Editor.normalize(editor, { force: true });
      return editor.children;
    },
    serialize: (value) => ({
      [config.path]: value,
    }),
    validate(value) {
      return value.every((node) => validateNode(node));
    },
  };
};
