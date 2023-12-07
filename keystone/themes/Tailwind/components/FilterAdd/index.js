import { Fragment, useMemo, useState } from "react";
import { useList } from "@keystone/keystoneProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ListFilterIcon,
  PlusIcon,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@keystone/primitives/default/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@keystone/primitives/default/ui/dropdown-menu";
import { ScrollArea } from "@keystone/primitives/default/ui/scroll-area";
import { Separator } from "@keystone/primitives/default/ui/separator";

export function FilterAdd({ listKey, filterableFields }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="secondary"
          className="flex items-center border"
          onClick={() => setIsOpen(true)}
        >
          <PlusIcon className="mr-2 w-4 h-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      {isOpen && (
        <FilterAddPopoverContent
          onClose={() => setIsOpen(false)}
          listKey={listKey}
          filterableFields={filterableFields}
        />
      )}
    </DropdownMenu>
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

  const handleSelectField = (fieldPath) => {
    const filterType = Object.keys(filtersByFieldThenType[fieldPath])[0];
    setState({
      kind: "filter-value",
      fieldPath,
      filterType,
      filterValue:
        fieldsWithFilters[fieldPath].controller.filter.types[filterType]
          .initialValue,
    });
  };

  return (
    <DropdownMenuContent align="end" className="w-[200px]">
      <form
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
      >
        <div className="flex justify-between">
          {state.kind !== "selecting-field" && (
            <Button
              onClick={() => {
                setState({ kind: "selecting-field" });
              }}
              size="xs"
              variant="outline"
            >
              <div className="sr-only">Back</div>
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenuLabel className="pb-0">
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
          </DropdownMenuLabel>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea vpClassName="max-h-72">
          {state.kind === "selecting-field" &&
            Object.keys(filtersByFieldThenType).map((fieldPath) => (
              <button
                key={fieldPath}
                className="rounded-sm px-2 py-1.5 text-sm w-full text-left hover:bg-gray-100 dark:hover:bg-gray-900"
                onClick={() => handleSelectField(fieldPath)}
              >
                {list.fields[fieldPath].label}
              </button>
            ))}
          {state.kind === "filter-value" && (
            <Select
              onValueChange={(filterType) => {
                setState({
                  kind: "filter-value",
                  fieldPath: state.fieldPath,
                  filterValue:
                    fieldsWithFilters[state.fieldPath].controller.filter.types[
                      filterType
                    ].initialValue,
                  filterType: filterType,
                });
              }}
            >
              <SelectTrigger className="mb-2">
                <SelectValue>
                  {filtersByFieldThenType[state.fieldPath][state.filterType]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(filtersByFieldThenType[state.fieldPath]).map(
                  (filterType) => (
                    <SelectItem key={filterType} value={filterType}>
                      {filtersByFieldThenType[state.fieldPath][filterType]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
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
        </ScrollArea>
        {state.kind == "filter-value" && (
          <div className="flex justify-between mt-4 pt-2 pb-1 px-1 border-t">
            <Button onClick={onClose} variant="ghost" size="xs">
              Cancel
            </Button>
            <Button type="submit" size="xs">
              Apply
            </Button>
          </div>
        )}
      </form>
    </DropdownMenuContent>
  );
}
