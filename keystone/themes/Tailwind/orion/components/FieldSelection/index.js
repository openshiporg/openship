import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../primitives/default/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../primitives/default/ui/dropdown-menu";
import { CheckIcon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";
import { Badge } from "../../primitives/default/ui/badge";
import { cloneElement, useState } from "react";
import { Columns3 } from "lucide-react";

function isArrayEqual(arrA, arrB) {
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) {
      return false;
    }
  }
  return true;
}

const Option = ({ children, isDisabled, isFocused, isSelected }) => {
  // Replace with Shadcn UI's equivalent, if available
  return (
    <div
      className={`option ${isFocused ? "focused" : ""} ${
        isSelected ? "selected" : ""
      }`}
    >
      {children}
      {/* Assuming Shadcn UI has an equivalent of CheckMark */}
      {isSelected && !isDisabled && <CheckIcon name="check" />}
    </div>
  );
};

// TODO: return type required by pnpm :(
export const fieldSelectionOptionsComponents = {
  Option,
};

function FieldSelectionContent({ onClose, list, fieldModesByFieldPath }) {
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
            ...otherQueryFields,
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
    <DropdownMenuContent align="start" className="w-[200px]">
      <DropdownMenuLabel>Display columns</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <ScrollArea className="h-[300px]">
        {fields.map((field) => (
          <DropdownMenuCheckboxItem
            key={field.value}
            checked={selectedFields.has(field.value)}
            onCheckedChange={(checked) => {
              const newSelectedFields = new Set(selectedFields);
              if (checked) {
                newSelectedFields.add(field.value);
              } else {
                newSelectedFields.delete(field.value);
              }
              setNewSelectedFields(Array.from(newSelectedFields));
            }}
            disabled={field.isDisabled}
          >
            {field.label}
          </DropdownMenuCheckboxItem>
        ))}
      </ScrollArea>
    </DropdownMenuContent>
  );
}

export function FieldSelection({ list, fieldModesByFieldPath, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const DefaultTrigger = () => (
    <button
      type="button"
      className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
    >
      <Columns3 size={12} className="stroke-muted-foreground" />
      COLUMNS
    </button>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children || <DefaultTrigger />}
      </DropdownMenuTrigger>
      {isOpen && (
        <FieldSelectionContent
          onClose={() => setIsOpen(false)}
          list={list}
          fieldModesByFieldPath={fieldModesByFieldPath}
        />
      )}
    </DropdownMenu>
  );
}
