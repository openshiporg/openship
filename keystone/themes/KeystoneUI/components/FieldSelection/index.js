/** @jsxRuntime classic */
/** @jsx jsx */

import { Button } from "@keystone-ui/button";
import { jsx, Box } from "@keystone-ui/core";
import { ChevronDownIcon } from "@keystone-ui/icons/icons/ChevronDownIcon";
import { CheckMark, OptionPrimitive, Options } from "@keystone-ui/options";
import { Popover } from "@keystone-ui/popover";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function isArrayEqual(arrA, arrB) {
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) {
      return false;
    }
  }
  return true;
}

const Option = (props) => {
  return (
    <OptionPrimitive {...props}>
      {props.children}
      <CheckMark
        isDisabled={props.isDisabled}
        isFocused={props.isFocused}
        isSelected={props.isSelected}
      />
    </OptionPrimitive>
  );
};

// TODO: return type required by pnpm :(
export const fieldSelectionOptionsComponents = {
  Option,
};

export function FieldSelection({ list, fieldModesByFieldPath }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  const selectedFields = useSelectedFields(list, fieldModesByFieldPath);

  const setNewSelectedFields = (selectedFields) => {
    if (isArrayEqual(selectedFields, list.initialColumns)) {
      const { fields: _ignore, ...otherQueryFields } = query;
      router.push(
        pathname +
          "?" +
          new URLSearchParams({
            otherQueryFields,
          })
      );
    } else {
   
      router.push(
        pathname +
          "?" +
          new URLSearchParams({
            ...query,
            fields: selectedFields.join(","),
          })
      );
    }
  };
  const fields = [];
  Object.keys(fieldModesByFieldPath).forEach((fieldPath) => {
    if (fieldModesByFieldPath[fieldPath] === "read") {
      fields.push({
        value: fieldPath,
        label: list.fields[fieldPath].label,
        isDisabled: selectedFields.size === 1 && selectedFields.has(fieldPath),
      });
    }
  });

  return (
    <Popover
      aria-label={`Columns options, list of column options to apply to the ${list.key} list`}
      triggerRenderer={({ triggerProps }) => {
        return (
          <Button weight="link" css={{ padding: 4 }} {...triggerProps}>
            <span
              css={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectedFields.size} column{selectedFields.size === 1 ? "" : "s"}{" "}
              <ChevronDownIcon size="smallish" />
            </span>
          </Button>
        );
      }}
    >
      <div css={{ width: 320 }}>
        <Box padding="medium">
          <Options
            onChange={(options) => {
              if (!Array.isArray(options)) return;
              setNewSelectedFields(options.map((x) => x.value));
            }}
            isMulti
            value={fields.filter((option) => selectedFields.has(option.value))}
            options={fields}
            components={fieldSelectionOptionsComponents}
          />
        </Box>
      </div>
    </Popover>
  );
}
