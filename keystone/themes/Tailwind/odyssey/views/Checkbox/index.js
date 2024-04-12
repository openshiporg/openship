import { Checkbox } from "@keystone/components/Checkbox";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { CellContainer } from "@keystone/components/CellContainer";

export const Field = ({ field, value, onChange, autoFocus }) => {
  return (
    <FieldContainer>
      <Checkbox
        autoFocus={autoFocus}
        disabled={onChange === undefined}
        onChange={(event) => {
          onChange?.(event.target.checked);
        }}
        checked={value}
        aria-describedby={
          field.description === null ? undefined : `${field.path}-description`
        }
      >
        <span>{field.label}</span>
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
      </Checkbox>
    </FieldContainer>
  );
};

export const Cell = ({ item, field }) => {
  const value = !!item[field.path];
  return (
    <CellContainer>
      <Checkbox disabled checked={value} size="small">
        <span>{value ? "True" : "False"}</span>
      </Checkbox>
    </CellContainer>
  );
};

export const CardValue = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {item[field.path] + ""}
    </FieldContainer>
  );
};

export const controller = (config) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: config.fieldMeta.defaultValue,
    deserialize(item) {
      const value = item[config.path];
      return typeof value === "boolean" ? value : false;
    },
    serialize(value) {
      return {
        [config.path]: value,
      };
    },
    filter: {
      Filter() {
        return null;
      },
      graphql({ type }) {
        return { [config.path]: { equals: type === "is" } };
      },
      Label({ label }) {
        return label.toLowerCase();
      },
      types: {
        is: {
          label: "is",
          initialValue: true,
        },
        not: {
          label: "is not",
          initialValue: true,
        },
      },
    },
  };
};
