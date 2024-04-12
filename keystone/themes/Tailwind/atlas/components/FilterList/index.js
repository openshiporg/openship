import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@keystone/primitives/default/ui/popover";
import { Button } from "@keystone/primitives/default/ui/button";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { Separator } from "../../primitives/default/ui/separator";

export function FilterList({ filters, list }) {
  return (
    <div className="pl-1 no-scrollbar overflow-x-auto flex gap-2">
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
        <div class="rounded-md inline-flex shadow-XS" role="group">
          <button
            type="button"
            className="text-nowrap px-3 py-[3px] text-xs font-medium text-slate-500 bg-white border border-slate-200 border-r-0 rounded-s-md hover:bg-slate-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-600 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            {field.label}{" "}
            <Label
              label={field.controller.filter.types[filter.type].label}
              type={filter.type}
              value={filter.value}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            class="px-1 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-e-md hover:bg-slate-200 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:hover:text-white dark:hover:bg-slate-600 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            <XIcon size={14} className="stroke-muted-foreground" />
          </button>
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
      <div className="flex justify-between px-2 pb-2">
        <Button variant="plain" onClick={onClose} size="xs">
          Cancel
        </Button>
        <Button type="submit" size="xs">
          Save
        </Button>
      </div>
    </form>
  );
}
