import { useSort } from "@keystone/utils/useSort";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@keystone/primitives/default/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerVerticalIcon } from "@radix-ui/react-icons";
import { ArrowDownAz, ArrowDownZa } from "lucide-react";
import { ScrollArea } from "@keystone/primitives/default/ui/scroll-area";

export function SortSelection({ list, orderableFields }) {
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
    ASC: <ArrowDownAz />,
    DESC: <ArrowDownZa />,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="border shadow-xs ml-auto hidden lg:flex data-[state=open]:bg-muted/20"
        >
          {sort ? (
            <>
              {sort.direction === "ASC" ? (
                <ArrowDownZa className="mr-2 h-4 w-4" />
              ) : (
                <ArrowDownAz className="mr-2 h-4 w-4" />
              )}
              {list.fields[sort.field].label}
            </>
          ) : (
            <>
              <MixerVerticalIcon className="mr-2 h-4 w-4" />
              Sort
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
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
                {option.label}
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
