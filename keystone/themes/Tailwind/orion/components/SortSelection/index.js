import { useSort } from "@keystone/utils/useSort";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../primitives/default/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown,
  ArrowDownAz,
  ArrowDownZa,
  ArrowUp,
  ArrowUpDown,
  X,
} from "lucide-react";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";
import { cloneElement } from "react";
import { Badge, BadgeButton } from "../../primitives/default/ui/badge";

export function SortSelection({ list, orderableFields, dropdownTrigger }) {
  const sort = useSort(list, orderableFields);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const sortIcons = {
    ASC: <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">ASC</Badge>, 
    DESC: <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">DESC</Badge>,
  };

  const triggerContent = sort ? (
    <>
      {list.fields[sort.field].label.toUpperCase()}
      {sortIcons[sort.direction]}
    </>
  ) : (
    <>
      <ArrowUpDown size={12} className="stroke-muted-foreground" />
      SORT
    </>
  );

  const resetSort = () => {
    const newQueryParams = new URLSearchParams(query);
    newQueryParams.delete('sortBy');
    router.push(`${pathname}?${newQueryParams.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {cloneElement(dropdownTrigger, {
          children: triggerContent,
        })}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <div className="flex items-center justify-between py-1.5">
          <DropdownMenuLabel className="py-0">Sort by</DropdownMenuLabel>
          {sort && (
            <BadgeButton
              onClick={resetSort}
              color="red"
              aria-label="Reset sort"
              className="mr-2 text-xs uppercase border tracking-wide font-medium py-0.5 px-1.5"
            >
              Clear
            </BadgeButton>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea vpClassName="max-h-72">
          {[...orderableFields, noFieldOption.value].map((fieldPath) => {
            const isNoFieldOption = fieldPath === noFieldOption.value;
            const option = isNoFieldOption
              ? noFieldOption
              : {
                  label: list.fields[fieldPath].label,
                  value: fieldPath,
                };

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  let newSortQuery;
                  if (isNoFieldOption) {
                    newSortQuery = ""; // No sort is applied
                  } else {
                    const newSortDirection =
                      sort?.field === option.value && sort.direction === "ASC"
                        ? "DESC"
                        : "ASC";
                    newSortQuery = `${newSortDirection === "DESC" ? "-" : ""}${
                      option.value
                    }`;
                  }

                  const newQueryParams = new URLSearchParams({
                    ...query,
                    sortBy: newSortQuery,
                  }).toString();

                  router.push(`${pathname}?${newQueryParams}`);
                }}
              >
                <span className="flex items-center justify-between w-full">
                  {option.label}
                  {sort?.field === option.value && sortIcons[sort.direction]}
                </span>
              </DropdownMenuItem>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const noFieldOption = {
  label: "Clear selection",
  value: "___________NO_FIELD___________",
};