import { memo, useId, useMemo } from "react";
import { FieldDescription } from "../FieldDescription";
import { Separator } from "../../primitives/default/ui/separator";
import { Button, buttonVariants } from "../../primitives/default/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@keystone/utils/cn";
import { Badge } from "../../primitives/default/ui/badge";

const RenderField = memo(function RenderField({
  field,
  value,
  autoFocus,
  forceValidation,
  onChange,
}) {
  return (
    <field.views.Field
      field={{
        ...field.controller,
        hideButtons: field.fieldMeta.hideButtons,
      }}
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
            <span className="text-red-600 dark:text-red-700 text-sm">
              {val.errors[0].message}
            </span>
          </div>,
        ];
      }
      return [
        fieldKey,
        <RenderField
          key={fieldKey}
          field={field}
          value={val.value}
          forceValidation={forceValidation}
          invalidFields={invalidFields.has(fieldKey)}
          onChange={fieldMode === "edit" ? onChange : undefined}
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
        <FieldGroup
          key={group.label}
          count={group.fields.length}
          label={group.label}
          description={group.description}
          collapsed={group.collapsed}
        >
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
    <div className="grid w-full items-center gap-4">
      {console.log(rendered) && rendered.length === 0
        ? "There are no fields that you can read or edit"
        : rendered}
    </div>
  );
}

function FieldGroup(props) {
  const descriptionId = useId();
  const labelId = useId();

  const divider = <Separator orientation="vertical" />;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={props.description === null ? undefined : descriptionId}
    >
      <details open={!props.collapsed}>
        <summary className="list-none outline-none [&::-webkit-details-marker]:hidden">
          <div className="flex gap-1.5 items-center">
            <div
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "mt-[1px] self-start px-1 h-5"
              )}
            >
              <ChevronRight className="size-3" />
            </div>
            {divider}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <text id={labelId} className="relative text-lg/5 font-medium">
                  {props.label}
                </text>
                <Badge className="text-[.7rem] py-0.5 uppercase tracking-wide font-medium">
                  {props.children.filter((item) => item !== undefined).length}{" "}
                  FIELD
                  {props.children.filter((item) => item !== undefined).length >
                  1
                    ? "S"
                    : ""}
                </Badge>
              </div>
              {props.description !== null && (
                <FieldDescription
                  className="opacity-50 text-sm"
                  id={descriptionId}
                >
                  {props.description}
                </FieldDescription>
              )}
            </div>
          </div>
        </summary>
        <div className="flex ml-[2.25rem] mt-2">
          {divider}
          <div className="w-full">
            <div className="space-y-4">{props.children}</div>
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
