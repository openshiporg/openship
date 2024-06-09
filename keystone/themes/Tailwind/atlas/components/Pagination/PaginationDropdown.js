import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cloneElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../primitives/default/ui/dropdown-menu-depracated";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";
import { Check, X } from "lucide-react";

const CustomInput = ({ value, onChange, onCommit, onCancel }) => (
  <div className="flex items-center">
    <div className="p-0.5 mr-1.5 flex items-center bg-white dark:bg-zinc-800 dark:border-zinc-600 border rounded-md h-[1.45rem]">
      <input
        className="text-sm bg-transparent border-0 text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none"
        style={{
          width: `${Math.max(1.4, value.length * 0.7)}em`,
        }}
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onCommit(e.target.value);
          }
        }}
        autoFocus
      />
    </div>
    <button
      type="button"
      className="flex border-r-0 rounded-r-none items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
      onClick={onCancel}
    >
      <X className="h-4 w-3" />
    </button>
    <button
      type="button"
      className="flex rounded-l-none items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
      onClick={() => onCommit(value)}
    >
      <Check className="h-4 w-3" />
    </button>
  </div>
);

export function PaginationDropdown({
  currentPage,
  total,
  pageSize,
  list,
  dropdownTrigger,
}) {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const pageSizeOptions = [1, 5, 10, 25, 50, 100];
  const [pageSizeInput, setPageSizeInput] = useState(pageSize.toString());
  const [selectedPageSize, setSelectedPageSize] = useState(
    pageSizeOptions.includes(pageSize) ? pageSize : "Custom"
  );
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handlePageSizeInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setPageSizeInput(newValue);
    }
  };

  const handlePageSizeInputBlur = () => {
    if (pageSizeInput === "") {
      setPageSizeInput(pageSize.toString());
    } else {
      handlePageSizeInputCommit(pageSizeInput);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (newSize === "Custom") {
      setSelectedPageSize("Custom");
      setPageSizeInput(pageSize.toString());
      setIsCustomizing(true);
    } else {
      const size = Math.max(1, Number(newSize));
      const newQuery = getQueryString({ pageSize: size });
      push(`${pathname}?${newQuery}`);
      setSelectedPageSize(size);
      setPageSizeInput(size.toString());
      setIsCustomizing(false);
    }
  };

  const handlePageSizeInputCommit = (value) => {
    const newSize = Math.max(1, parseInt(value, 10) || 1);
    const newQuery = getQueryString({ pageSize: newSize });
    push(`${pathname}?${newQuery}`);
    setSelectedPageSize(newSize);
    setPageSizeInput(newSize.toString());
    setIsCustomizing(false);
  };

  const handlePageSizeInputCancel = () => {
    setSelectedPageSize(pageSize);
    setPageSizeInput(pageSize.toString());
    setIsCustomizing(false);
  };

  const getQueryString = (newParams) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key]); // Use `set` to ensure unique keys
    });
    return allParams.toString();
  };

  const defaultTrigger = (
    <button
      type="button"
      className="flex items-center gap-1.5 pr-2 pl-2 uppercase text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
    >
      {selectedPageSize === "Custom" ? "Custom" : selectedPageSize} Per Page
    </button>
  );

  return isCustomizing ? (
    <CustomInput
      value={pageSizeInput}
      onChange={handlePageSizeInputChange}
      onCommit={handlePageSizeInputCommit}
      onCancel={handlePageSizeInputCancel}
    />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {dropdownTrigger
          ? cloneElement(dropdownTrigger, { asChild: true })
          : defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Page Size</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea vpClassName="max-h-72">
          {pageSizeOptions.map((size) => (
            <DropdownMenuItem
              key={size}
              onSelect={() => handlePageSizeChange(size)}
            >
              {size}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onSelect={() => handlePageSizeChange("Custom")}>
            Custom
          </DropdownMenuItem>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
