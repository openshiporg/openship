import { Fragment, useMemo, useState } from "react";
import { useList } from "@keystone/keystoneProvider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../primitives/default/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../primitives/default/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../primitives/default/ui/popover";
import { Separator } from "../../primitives/default/ui/separator";

export function FilterAdd({ listKey, filterableFields, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      {isOpen && (
        <PopoverContent align="start" className="w-[200px] p-0">
          <FilterAddPopoverContent
            onClose={() => setIsOpen(false)}
            listKey={listKey}
            filterableFields={filterableFields}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

function FilterAddPopoverContent({ onClose, listKey, filterableFields }) {
  const list = useList(listKey);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

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

  const [state, setState] = useState({
    kind: "selecting-field",
    fieldPath: Object.keys(filtersByFieldThenType)[0],
    filterType: Object.keys(
      filtersByFieldThenType[Object.keys(filtersByFieldThenType)[0]] || {}
    )[0],
  });

  return (
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
      <div className="flex justify-between items-center px-2 py-2">
        {state.kind !== "selecting-field" && (
          <Button
            onClick={() => {
              setState({ kind: "selecting-field" });
            }}
            variant="ghost"
            size="icon"
            className="[&_svg]:size-3 w-6 h-6"
          >
            <div className="sr-only">Back</div>
            <ChevronLeftIcon />
          </Button>
        )}
        <div className="text-sm font-medium">
          {state.kind === "selecting-field"
            ? "Filter"
            : list.fields[state.fieldPath].label}
        </div>
      </div>
      <Separator />

      <div className="p-2">
        {state.kind === "selecting-field" && (
          <Select
            value={state.fieldPath}
            onValueChange={(fieldPath) => {
              setState({
                kind: "filter-value",
                fieldPath,
                filterType: Object.keys(filtersByFieldThenType[fieldPath])[0],
                filterValue:
                  fieldsWithFilters[fieldPath].controller.filter.types[
                    Object.keys(filtersByFieldThenType[fieldPath])[0]
                  ].initialValue,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue className="text-sm" placeholder="Select a field" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(filtersByFieldThenType).map((fieldPath) => (
                <SelectItem key={fieldPath} value={fieldPath}>
                  {list.fields[fieldPath].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {state.kind === "filter-value" && (
          <>
            <Select
              value={state.filterType}
              onValueChange={(filterType) => {
                setState({
                  ...state,
                  filterType,
                  filterValue:
                    fieldsWithFilters[state.fieldPath].controller.filter.types[
                      filterType
                    ].initialValue,
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

            <div className="pb-3">
              {(() => {
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
            </div>
          </>
        )}
      </div>

      {state.kind === "filter-value" && (
        <>
          <Separator />
          <div className="flex justify-between p-2">
            <Button onClick={onClose} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
