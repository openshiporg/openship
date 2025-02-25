"use client";

import { Node } from "slate";
import { DocumentRenderer } from "@keystone-6/document-renderer";

import { DocumentEditor } from "./DocumentEditor";
import { ForceValidationProvider } from "./DocumentEditor/utils-hooks";
import { FieldContainer } from "../../components/FieldContainer";
import { FieldLabel } from "../../components/FieldLabel";
import { FieldDescription } from "../../components/FieldDescription";
import { CellContainer } from "../../components/CellContainer";
import { CellLink } from "../../components/CellLink";
export { controller } from "./views-shared";

export function Field({ field, value, onChange, autoFocus, forceValidation }) {
  return (
    <FieldContainer className="overflow-hidden">
      <FieldLabel as="span" id={`${field.path}-label`}>
        {field.label}
      </FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <div className="border bg-background rounded-md overflow-hidden">
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
      </div>
    </FieldContainer>
  );
}

function serialize(nodes) {
  return nodes.map((n) => Node.string(n)).join("\n");
}

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
