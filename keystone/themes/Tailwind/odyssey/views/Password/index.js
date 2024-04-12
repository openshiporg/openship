import { Fragment, useState } from "react";

// @ts-ignore
import dumbPasswords from "dumb-passwords";
import { CellContainer } from "@keystone/components/CellContainer";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { TextInput } from "@keystone/components/TextInput";
import { Button } from "@keystone/primitives/default/ui/button";
import { EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@keystone/primitives/default/ui/toggle-group";

function validate(value, validation, fieldLabel) {
  if (
    value.kind === "initial" &&
    (value.isSet === null || value.isSet === true)
  ) {
    return undefined;
  }
  if (value.kind === "initial" && validation?.isRequired) {
    return `${fieldLabel} is required`;
  }
  if (value.kind === "editing" && value.confirm !== value.value) {
    return `The passwords do not match`;
  }
  if (value.kind === "editing") {
    const val = value.value;
    if (val.length < validation.length.min) {
      if (validation.length.min === 1) {
        return `${fieldLabel} must not be empty`;
      }
      return `${fieldLabel} must be at least ${validation.length.min} characters long`;
    }
    if (validation.length.max !== null && val.length > validation.length.max) {
      return `${fieldLabel} must be no longer than ${validation.length.max} characters`;
    }
    if (validation.match && !validation.match.regex.test(val)) {
      return validation.match.explanation;
    }
    if (validation.rejectCommon && dumbPasswords.check(val)) {
      return `${fieldLabel} is too common and is not allowed`;
    }
  }
  return undefined;
}

function isSetText(isSet) {
  return isSet == null ? "Access Denied" : isSet ? "Is set" : "Is not set";
}

export const Field = ({
  field,
  value,
  onChange,
  forceValidation,
  autoFocus,
}) => {
  const [showInputValue, setShowInputValue] = useState(false);
  const [touchedFirstInput, setTouchedFirstInput] = useState(false);
  const [touchedSecondInput, setTouchedSecondInput] = useState(false);
  const shouldShowValidation =
    forceValidation || (touchedFirstInput && touchedSecondInput);
  const validationMessage = shouldShowValidation
    ? validate(value, field.validation, field.label)
    : undefined;
  const validation = validationMessage && (
    <span className="text-red-600 dark:text-red-500">
      {validationMessage}
    </span>
  );
  const inputType = showInputValue ? "text" : "password";
  return (
    <FieldContainer as="fieldset">
      <FieldLabel as="legend">{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      {onChange === undefined ? (
        isSetText(value.isSet)
      ) : value.kind === "initial" ? (
        <Fragment>
          <Button
            autoFocus={autoFocus}
            variant="outline"
            className="shadow-xs"
            onClick={() => {
              onChange({
                kind: "editing",
                confirm: "",
                value: "",
                isSet: value.isSet,
              });
            }}
          >
            {value.isSet ? "Change Password" : "Set Password"}
          </Button>
          {validation}
        </Fragment>
      ) : (
        <div className="space-y-1.5">
          <div className="flex space-x-2">
            {/* <VisuallyHidden as="label" htmlFor={`${field.path}-new-password`}>
              New Password
            </VisuallyHidden> */}
            <TextInput
              id={`${field.path}-new-password`}
              autoFocus
              invalid={validationMessage !== undefined}
              type={inputType}
              value={value.value}
              placeholder="New Password"
              onChange={(event) => {
                onChange({
                  ...value,
                  value: event.target.value,
                });
              }}
              onBlur={() => {
                setTouchedFirstInput(true);
              }}
            />
            <label
              htmlFor={`${field.path}-confirm-password`}
              className="sr-only"
            >
              Confirm Password
            </label>
            <TextInput
              id={`${field.path}-confirm-password`}
              invalid={validationMessage !== undefined}
              type={inputType}
              value={value.confirm}
              placeholder="Confirm Password"
              onChange={(event) => {
                onChange({
                  ...value,
                  confirm: event.target.value,
                });
              }}
              onBlur={() => {
                setTouchedSecondInput(true);
              }}
            />
            <Button
              onClick={() => {
                setShowInputValue(!showInputValue);
              }}
              className="px-3 border-dashed"
              variant="outline"
            >
              <span className="sr-only">
                {showInputValue ? "Hide Text" : "Show Text"}
              </span>
              {showInputValue ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </Button>
            <Button
              onClick={() => {
                onChange({
                  kind: "initial",
                  isSet: value.isSet,
                });
              }}
              className="px-3 border-dashed"
              variant="outline"
            >
              <span className="sr-only">Cancel</span>
              <XIcon className="w-5 h-5" />
            </Button>
          </div>
          {validation}
        </div>
      )}
    </FieldContainer>
  );
};

export const Cell = ({ item, field }) => {
  return <CellContainer>{isSetText(item[field.path]?.isSet)}</CellContainer>;
};

export const CardValue = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {isSetText(item[field.path]?.isSet)}
    </FieldContainer>
  );
};

export const controller = (config) => {
  const validation = {
    ...config.fieldMeta.validation,
    match:
      config.fieldMeta.validation.match === null
        ? null
        : {
            regex: new RegExp(
              config.fieldMeta.validation.match.regex.source,
              config.fieldMeta.validation.match.regex.flags
            ),
            explanation: config.fieldMeta.validation.match.explanation,
          },
  };
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path} {isSet}`,
    validation,
    defaultValue: {
      kind: "initial",
      isSet: false,
    },
    validate: (state) =>
      validate(state, validation, config.label) === undefined,
    deserialize: (data) => ({
      kind: "initial",
      isSet: data[config.path]?.isSet ?? null,
    }),
    serialize: (value) => {
      if (value.kind === "initial") return {};
      return { [config.path]: value.value };
    },
    filter:
      config.fieldMeta.isNullable === false
        ? undefined
        : {
            Filter(props) {
              return (
                <ToggleGroup
                  type="single"
                  value={props.value.toString()}
                  onValueChange={(value) => {
                    props.onChange(Number(value));
                  }}
                >
                  <ToggleGroupItem value="0">Is Not Set</ToggleGroupItem>
                  <ToggleGroupItem value="1">Is Set</ToggleGroupItem>
                </ToggleGroup>
              );
            },
            graphql: ({ value }) => {
              return { [config.path]: { isSet: value } };
            },
            Label({ value }) {
              return value ? "is set" : "is not set";
            },
            types: {
              is_set: {
                label: "Is Set",
                initialValue: true,
              },
            },
          },
  };
};
