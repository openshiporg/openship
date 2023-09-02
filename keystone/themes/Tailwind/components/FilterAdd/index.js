/** @jsxRuntime classic */
/** @jsx jsx */

import { Fragment, useMemo, useState } from "react";
import { Button } from "@keystone-ui/button";
import {
  Box,
  Divider,
  Heading,
  Stack,
  VisuallyHidden,
  jsx,
  useTheme,
} from "@keystone-ui/core";
import { Select } from "@keystone-ui/fields";
import { ChevronLeftIcon } from "@keystone-ui/icons/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@keystone-ui/icons/icons/ChevronRightIcon";
import { ChevronDownIcon } from "@keystone-ui/icons/icons/ChevronDownIcon";
import { OptionPrimitive, Options } from "@keystone-ui/options";
import { PopoverDialog, usePopover } from "@keystone-ui/popover";
import { useList } from "@keystone/keystoneProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const fieldSelectComponents = {
  Option: ({ children, ...props }) => {
    let theme = useTheme();
    let iconColor = props.isFocused
      ? theme.colors.foreground
      : theme.colors.foregroundDim;
    return (
      <OptionPrimitive {...props}>
        <span>{children}</span>
        <div
          css={{
            alignItems: "center",
            display: "flex",
            height: 24,
            justifyContent: "center",
            width: 24,
          }}
        >
          <ChevronRightIcon css={{ color: iconColor }} />
        </div>
      </OptionPrimitive>
    );
  },
};
export function FilterAdd({ listKey, filterableFields }) {
  const { isOpen, setOpen, trigger, dialog, arrow } = usePopover({
    placement: "bottom",
    modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
  });

  return (
    <Fragment>
      <Button
        tone="active"
        {...trigger.props}
        ref={trigger.ref}
        onClick={() => setOpen(!isOpen)}
      >
        <Box as="span" marginRight="xsmall">
          Filter List
        </Box>
        <ChevronDownIcon size="small" />
      </Button>
      <PopoverDialog
        aria-label={`Filters options, list of filters to apply to the ${listKey} list`}
        arrow={arrow}
        isVisible={isOpen}
        {...dialog.props}
        ref={dialog.ref}
      >
        {isOpen && (
          <FilterAddPopoverContent
            onClose={() => {
              setOpen(false);
            }}
            listKey={listKey}
            filterableFields={filterableFields}
          />
        )}
      </PopoverDialog>
    </Fragment>
  );
}

function FilterAddPopoverContent({ onClose, listKey, filterableFields }) {
  const list = useList(listKey);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  const router = useRouter();
  const fieldsWithFilters = useMemo(() => {
    const fieldsWithFilters = {};
    Object.keys(list.fields).forEach((fieldPath) => {
      const field = list.fields[fieldPath];
      if (filterableFields.has(fieldPath) && field.controller.filter) {
        fieldsWithFilters[fieldPath] = field;
      }
    });
    return fieldsWithFilters;
  }, [list.fields, filterableFields]);
  const filtersByFieldThenType = useMemo(() => {
    const filtersByFieldThenType = {};
    Object.keys(fieldsWithFilters).forEach((fieldPath) => {
      const field = fieldsWithFilters[fieldPath];
      let hasUnusedFilters = false;
      const filters = {};
      Object.keys(field.controller.filter.types).forEach((filterType) => {
        if (query[`!${fieldPath}_${filterType}`] === undefined) {
          hasUnusedFilters = true;
          filters[filterType] = field.controller.filter.types[filterType].label;
        }
      });
      if (hasUnusedFilters) {
        filtersByFieldThenType[fieldPath] = filters;
      }
    });
    return filtersByFieldThenType;
  }, [query, fieldsWithFilters]);
  const [state, setState] = useState({ kind: "selecting-field" });

  return (
    <Stack
      padding="medium"
      as="form"
      css={{ minWidth: 320 }}
      onSubmit={(event) => {
        event.preventDefault();
        if (state.kind === "filter-value") {
          router.push(
            pathname +
              "?" +
              new URLSearchParams({
                ...query,
                [`!${state.fieldPath}_${state.filterType}`]: JSON.stringify(
                  state.filterValue
                ),
              })
          );
          onClose();
        }
      }}
      gap="small"
    >
      {" "}
      <div css={{ position: "relative" }}>
        {state.kind !== "selecting-field" && (
          <button
            type="button"
            onClick={() => {
              setState({ kind: "selecting-field" });
            }}
            css={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              position: "absolute",
            }}
          >
            <VisuallyHidden>Back</VisuallyHidden>
            <ChevronLeftIcon size="smallish" />
          </button>
        )}
        <Heading textAlign="center" type="h5">
          {(() => {
            switch (state.kind) {
              case "selecting-field": {
                return "Filter";
              }
              case "filter-value": {
                return list.fields[state.fieldPath].label;
              }
            }
          })()}
        </Heading>
      </div>
      <Divider />
      {state.kind === "selecting-field" && (
        <Options
          components={fieldSelectComponents}
          onChange={(newVal) => {
            const fieldPath = newVal.value;
            const filterType = Object.keys(
              filtersByFieldThenType[fieldPath]
            )[0];
            setState({
              kind: "filter-value",
              fieldPath,
              filterType,
              filterValue:
                fieldsWithFilters[fieldPath].controller.filter.types[filterType]
                  .initialValue,
            });
          }}
          options={Object.keys(filtersByFieldThenType).map((fieldPath) => ({
            label: fieldsWithFilters[fieldPath].label,
            value: fieldPath,
          }))}
        />
      )}
      {state.kind === "filter-value" && (
        <Select
          width="full"
          value={{
            value: state.filterType,
            label: filtersByFieldThenType[state.fieldPath][state.filterType],
          }}
          onChange={(newVal) => {
            if (newVal) {
              setState({
                kind: "filter-value",
                fieldPath: state.fieldPath,
                filterValue:
                  fieldsWithFilters[state.fieldPath].controller.filter.types[
                    newVal.value
                  ].initialValue,
                filterType: newVal.value,
              });
            }
          }}
          options={Object.keys(filtersByFieldThenType[state.fieldPath]).map(
            (filterType) => ({
              label: filtersByFieldThenType[state.fieldPath][filterType],
              value: filterType,
            })
          )}
        />
      )}
      {state.kind == "filter-value" &&
        (() => {
          const { Filter } =
            fieldsWithFilters[state.fieldPath].controller.filter;
          return (
            <Filter
              type={state.filterType}
              value={state.filterValue}
              onChange={(value) => {
                setState((state) => ({
                  ...state,
                  filterValue: value,
                }));
              }}
            />
          );
        })()}
      {state.kind == "filter-value" && (
        <div css={{ display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit">Apply</Button>
        </div>
      )}
    </Stack>
  );
}
