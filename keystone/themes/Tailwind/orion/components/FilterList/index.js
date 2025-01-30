import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../primitives/default/ui/popover";
import { Button } from "../../primitives/default/ui/button";
import { ChevronDownIcon, XIcon, ChevronRightIcon } from "lucide-react";
import { Separator } from "../../primitives/default/ui/separator";
import { useList } from "@keystone/keystoneProvider";

export function FilterList({ filters, list }) {
  return (
    filters.length > 0 && (
      <div className="flex flex-wrap gap-2 w-full">
        {filters.map((filter) => {
          const field = list.fields[filter.field];
          return (
            <FilterPill
              key={`${filter.field}_${filter.type}`}
              field={field}
              filter={filter}
            />
          );
        })}
      </div>
    )
  );
}

function FilterPill({ filter, field }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const Label = field.controller.filter.Label; // Assuming Label is a component

  const onRemove = () => {
    const { [`!${filter.field}_${filter.type}`]: _ignore, ...queryToKeep } =
      query;
    router.push(`${pathname}?${new URLSearchParams(queryToKeep).toString()}`);
  };

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      placement="bottom"
    >
      <PopoverTrigger asChild>
        <div
          className="inline-flex rounded-md text-muted-foreground shadow-xs"
          role="group"
        >
          <div className="flex border rounded-s-md">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none rounded-s-[calc(theme(borderRadius.md)-1px)] [&_svg]:size-3 w-6 h-6 px-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <XIcon  />
            </Button>
          </div>
          <Button
            variant="outline"
            size="xs"
            className="py-0.5 shadow-none justify-start uppercase flex-wrap rounded-l-none border-l-0 [&_svg]:size-3.5 text-xs px-2"
          >
            <span>{field.label}</span>
            <ChevronRightIcon />
            <span>{field.controller.filter.types[filter.type].label}</span>
            <ChevronRightIcon />
            <div className="flex flex-wrap gap-1">
              {typeof filter.value === "string" &&
              filter.value.includes(",") ? (
                filter.value.split(",").map((value, index) => (
                  <span
                    key={index}
                    className="text-[.6rem] font-semibold text-indigo-600 dark:text-indigo-400 bg-zinc-100 dark:bg-zinc-800 px-1 py-[0.05rem] rounded truncate max-w-[150px]"
                  >
                    {value.trim()}
                  </span>
                ))
              ) : (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {filter.value}
                </span>
              )}
            </div>
            <ChevronDownIcon />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <EditDialog
          onClose={() => setPopoverOpen(false)}
          field={field}
          filter={filter}
          query={query}
          pathname={pathname}
        />
      </PopoverContent>
    </Popover>
  );
}

function EditDialog({ filter, field, onClose }) {
  const Filter = field.controller.filter.Filter;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  const [value, setValue] = useState(filter.value);

  const handleSubmit = (event) => {
    event.preventDefault();
    router.push(
      `${pathname}?${new URLSearchParams({
        ...query,
        [`!${filter.field}_${filter.type}`]: JSON.stringify(value),
      }).toString()}`
    );
    onClose();
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div className="px-2 pt-3 pb-1">
        <Filter type={filter.type} value={value} onChange={setValue} />
      </div>
      <Separator />
      <div className="flex justify-between gap-2 px-2 pb-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}
