import { Fragment, useState } from "react";
import { CellContainer } from "@keystone/components/CellContainer";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { Select, MultiSelect } from "@keystone/components/Select";
import { Radio } from "@keystone/components/Radio";
import { CellLink } from "@keystone/components/CellLink";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@keystone/primitives/default/ui/toggle-group";

export const Field = ({
  field,
  value,
  onChange,
  autoFocus,
  forceValidation,
}) => {
  const [hasChanged, setHasChanged] = useState(false);
  const validationMessage =
    (hasChanged || forceValidation) && !validate(value, field.isRequired) ? (
      <span className="text-red-600 dark:text-red-500">
        {field.label} is required
      </span>
    ) : null;
  return (
    <FieldContainer as={field.displayMode === "select" ? "div" : "fieldset"}>
      {field.displayMode === "select" ? (
        <Fragment>
          <FieldLabel htmlFor={field.path}>{field.label}</FieldLabel>
          <FieldDescription id={`${field.path}-description`}>
            {field.description}
          </FieldDescription>
          <Select
            id={field.path}
            isClearable
            autoFocus={autoFocus}
            options={field.options}
            isDisabled={onChange === undefined}
            onChange={(newVal) => {
              onChange?.({ ...value, value: newVal });
              setHasChanged(true);
            }}
            value={value.value}
            aria-describedby={
              field.description === null
                ? undefined
                : `${field.path}-description`
            }
            portalMenu
          />
          {validationMessage}
        </Fragment>
      ) : field.displayMode === "radio" ? (
        <Fragment>
          <FieldLabel as="legend">{field.label}</FieldLabel>
          <FieldDescription id={`${field.path}-description`}>
            {field.description}
          </FieldDescription>
          <div>
            {field.options.map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                checked={value.value?.value === option.value}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange?.({ ...value, value: option });
                    setHasChanged(true);
                  }
                }}
              >
                {option.label}
              </Radio>
            ))}
            {value.value !== null &&
              onChange !== undefined &&
              !field.isRequired && (
                <Button
                  onClick={() => {
                    onChange({ ...value, value: null });
                    setHasChanged(true);
                  }}
                >
                  Clear
                </Button>
              )}
          </div>
          {validationMessage}
        </Fragment>
      ) : (
        <Fragment>
          <FieldLabel as="legend">{field.label}</FieldLabel>
          <FieldDescription id={`${field.path}-description`}>
            {field.description}
          </FieldDescription>
          <div>
            <ToggleGroup
              type="single"
              value={
                value.value
                  ? field.options.findIndex(
                      (x) => x.value === value.value.value
                    )
                  : undefined
              }
              onValueChange={(index) => {
                onChange?.({ ...value, value: field.options[index] });
                setHasChanged(true);
              }}
            >
              {field.options.map((x) => (
                <ToggleGroupItem value={x.value}>{x.label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            {value.value !== null &&
              onChange !== undefined &&
              !field.isRequired && (
                <Button
                  onClick={() => {
                    onChange({ ...value, value: null });
                    setHasChanged(true);
                  }}
                >
                  Clear
                </Button>
              )}
          </div>
          {validationMessage}
        </Fragment>
      )}
    </FieldContainer>
  );
};

export const Cell = ({ item, field, linkTo }) => {
  let value = item[field.path] + "";
  const label = field.options.find((x) => x.value === value)?.label;
  return linkTo ? (
    <CellLink {...linkTo}>{label}</CellLink>
  ) : (
    <CellContainer>{label}</CellContainer>
  );
};
Cell.supportsLinkTo = true;

export const CardValue = ({ item, field }) => {
  let value = item[field.path] + "";
  const label = field.options.find((x) => x.value === value)?.label;

  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {label}
    </FieldContainer>
  );
};

function validate(value, isRequired) {
  if (isRequired) {
    // if you got null initially on the update screen, we want to allow saving
    // since the user probably doesn't have read access control
    if (value.kind === "update" && value.initial === null) {
      return true;
    }
    return value.value !== null;
  }
  return true;
}

export const controller = (config) => {
  const optionsWithStringValues = config.fieldMeta.options.map((x) => ({
    label: x.label,
    value: x.value.toString(),
  }));

  // Transform from string value to type appropriate value
  const t = (v) =>
    v === null ? null : config.fieldMeta.type === "integer" ? parseInt(v) : v;

  const stringifiedDefault = config.fieldMeta.defaultValue?.toString();

  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: {
      kind: "create",
      value:
        optionsWithStringValues.find((x) => x.value === stringifiedDefault) ??
        null,
    },
    type: config.fieldMeta.type,
    displayMode: config.fieldMeta.displayMode,
    isRequired: config.fieldMeta.isRequired,
    options: optionsWithStringValues,
    deserialize: (data) => {
      for (const option of config.fieldMeta.options) {
        if (option.value === data[config.path]) {
          const stringifiedOption = {
            label: option.label,
            value: option.value.toString(),
          };
          return {
            kind: "update",
            initial: stringifiedOption,
            value: stringifiedOption,
          };
        }
      }
      return { kind: "update", initial: null, value: null };
    },
    serialize: (value) => ({ [config.path]: t(value.value?.value ?? null) }),
    validate: (value) => validate(value, config.fieldMeta.isRequired),
    filter: {
      Filter(props) {
        return (
          <MultiSelect
            onChange={props.onChange}
            options={optionsWithStringValues}
            value={props.value}
            autoFocus
          />
        );
      },
      graphql: ({ type, value: options }) => ({
        [config.path]: {
          [type === "not_matches" ? "notIn" : "in"]: options.map((x) =>
            t(x.value)
          ),
        },
      }),
      Label({ type, value }) {
        if (!value.length) {
          return type === "not_matches" ? `is set` : `has no value`;
        }
        if (value.length > 1) {
          const values = value.map((i) => i.label).join(", ");
          return type === "not_matches"
            ? `is not in [${values}]`
            : `is in [${values}]`;
        }
        const optionLabel = value[0].label;
        return type === "not_matches"
          ? `is not ${optionLabel}`
          : `is ${optionLabel}`;
      },
      types: {
        matches: {
          label: "Matches",
          initialValue: [],
        },
        not_matches: {
          label: "Does not match",
          initialValue: [],
        },
      },
    },
  };
};
