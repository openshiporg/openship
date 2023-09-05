/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx } from '@keystone-ui/core';
import { validateImage, ImageWrapper } from "./Field";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldLabel } from "@keystone/components/FieldLabel";

export { Field } from "./Field";

export const Cell = ({ item, field }) => {
  const data = item[field.path];
  if (!data) return null;
  return (
    <div
      css={{
        alignItems: "center",
        display: "flex",
        height: 24,
        lineHeight: 0,
        width: 24,
      }}
    >
      <img
        alt={data.filename}
        css={{ maxHeight: "100%", maxWidth: "100%" }}
        src={data.url}
      />
    </div>
  );
};

export const CardValue = ({ item, field }) => {
  const data = item[field.path];
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {data && (
        <ImageWrapper>
          <img css={{ width: "100%" }} alt={data.filename} src={data.url} />
        </ImageWrapper>
      )}
    </FieldContainer>
  );
};

export const controller = (config) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} {
        url
        id
        extension
        width
        height
        filesize
      }`,
    defaultValue: { kind: "empty" },
    deserialize(item) {
      const value = item[config.path];
      if (!value) return { kind: "empty" };
      return {
        kind: "from-server",
        data: {
          src: value.url,
          id: value.id,
          extension: value.extension,
          ref: value.ref,
          width: value.width,
          height: value.height,
          filesize: value.filesize,
        },
      };
    },
    validate(value) {
      return value.kind !== "upload" || validateImage(value.data) === undefined;
    },
    serialize(value) {
      if (value.kind === "upload") {
        return { [config.path]: { upload: value.data.file } };
      }

      if (value.kind === "remove") {
        return { [config.path]: null };
      }
      return {};
    },
  };
};
