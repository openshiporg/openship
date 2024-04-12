import { memo, useId, useMemo } from "react";
import { FieldDescription } from "@keystone/components/FieldDescription";

const RenderField = memo(function RenderField({
  field,
  value,
  autoFocus,
  forceValidation,
  onChange,
}) {
  return (
    <field.views.Field
      field={field.controller}
      onChange={useMemo(() => {
        if (onChange === undefined) return undefined;
        return (value) => {
          onChange((val) => ({
            ...val,
            [field.controller.path]: { kind: "value", value },
          }));
        };
      }, [onChange, field.controller.path])}
      value={value}
      autoFocus={autoFocus}
      forceValidation={forceValidation}
    />
  );
});

export function Fields({
  fields,
  value,
  fieldModes = null,
  fieldPositions = null,
  forceValidation,
  invalidFields,
  position = "form",
  groups = [],
  onChange,
}) {
  const renderedFields = Object.fromEntries(
    Object.keys(fields).map((fieldKey, index) => {
      const field = fields[fieldKey];
      const val = value[fieldKey];
      const fieldMode = fieldModes === null ? "edit" : fieldModes[fieldKey];
      const fieldPosition =
        fieldPositions === null ? "form" : fieldPositions[fieldKey];
      if (fieldMode === "hidden") return [fieldKey, null];
      if (fieldPosition !== position) return [fieldKey, null];
      if (val.kind === "error") {
        return [
          fieldKey,
          <div key={fieldKey}>
            {field.label}:{" "}
            <span className="text-red-600 dark:text-red-500">{val.errors[0].message}</span>
          </div>,
        ];
      }
      return [
        fieldKey,
        <RenderField
          key={fieldKey}
          field={field}
          value={val.value}
          forceValidation={forceValidation && invalidFields.has(fieldKey)}
          onChange={fieldMode === "edit" ? onChange : undefined}
          autoFocus={index === 0}
        />,
      ];
    })
  );
  const rendered = [];
  const fieldGroups = new Map();
  for (const group of groups) {
    const state = { group, rendered: false };
    for (const field of group.fields) {
      fieldGroups.set(field.path, state);
    }
  }
  for (const field of Object.values(fields)) {
    const fieldKey = field.path;
    if (fieldGroups.has(fieldKey)) {
      const groupState = fieldGroups.get(field.path);
      if (groupState.rendered) {
        continue;
      }
      groupState.rendered = true;
      const { group } = groupState;
      const renderedFieldsInGroup = group.fields.map(
        (field) => renderedFields[field.path]
      );
      if (renderedFieldsInGroup.every((field) => field === null)) {
        continue;
      }
      rendered.push(
        <FieldGroup label={group.label} description={group.description}>
          {renderedFieldsInGroup}
        </FieldGroup>
      );
      continue;
    }
    if (renderedFields[fieldKey] === null) {
      continue;
    }
    rendered.push(renderedFields[fieldKey]);
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {console.log(rendered) && rendered.length === 0
        ? "There are no fields that you can read or edit"
        : rendered}
    </div>
  );
}

function FieldGroup(props) {
  const descriptionId = useId();
  const labelId = useId();

  const divider = <div className="h-full w-px" />;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={props.description === null ? undefined : descriptionId}
    >
      <details open>
        <summary className="list-none outline-none">
          <div className="flex space-x-4">
            <div className="p-0 h-10 w-10 focus:[apply-focus-styles] open:rotate-90">
              {downChevron}
            </div>
            {divider}
            <text id={labelId} className="relative text-lg font-bold">
              {props.label}
            </text>
          </div>
        </summary>
        <div className="flex space-x-4">
          <div />
          {divider}
          <div>
            {props.description !== null && (
              <FieldDescription id={descriptionId}>
                {props.description}
              </FieldDescription>
            )}
            <div className="mt-12 space-y-12">{props.children}</div>
          </div>
        </div>
      </details>
    </div>
  );
}

const downChevron = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 3L8.75 6L5 9L5 3Z" fill="currentColor" />
  </svg>
);
