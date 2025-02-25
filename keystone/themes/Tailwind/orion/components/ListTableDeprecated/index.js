import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useList } from "@keystone/keystoneProvider";
import { getRootGraphQLFieldsFromFieldController } from "@keystone-6/core/admin-ui/utils";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AdminLink } from "../AdminLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../primitives/default/ui/table";
import { CheckboxControl } from "../Checkbox";
import { ScrollArea, ScrollBar } from "../../primitives/default/ui/scroll-area";
import Image from "next/image";
import { cn } from "@keystone/utils/cn";

export function ListTable({
  selectedFields,
  listKey,
  itemsGetter,
  count,
  sort,
  currentPage,
  pageSize,
  selectedItems,
  onSelectedItemsChange,
  orderableFields,
  refetch,
}) {
  const list = useList(listKey);

  const [data, setData] = useState(() => [...(itemsGetter.data ?? [])]);

  const searchParams = useSearchParams();
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  useEffect(() => {
    setData([...(itemsGetter.data ?? [])]);
  }, [itemsGetter.data]);

  const [sorting, setSorting] = useState(() =>
    sort ? [{ id: sort.field, desc: sort.direction === "DESC" }] : []
  );
  const [rowSelection, setRowSelection] = useState(() => {
    const initialSelection = {};
    selectedItems.forEach((item) => {
      initialSelection[item] = true;
    });
    return initialSelection;
  });

  const hasSelectedItems = selectedItems.size > 0;

  const columns = useMemo(() => {
    const checkboxColumn = {
      id: "selection",
      header: () => (
        <CheckboxControl
          size="small"
          checked={selectedItems.size === itemsGetter.data?.length}
          className="cursor-default flex items-center"
          onChange={() => {
            const newSelectedItems = new Set();
            if (selectedItems.size !== itemsGetter.data?.length) {
              itemsGetter.data?.forEach((item) => {
                if (item !== null && item.id !== null) {
                  newSelectedItems.add(item.id);
                }
              });
            }
            onSelectedItemsChange(newSelectedItems);
          }}
        />
      ),
      cell: ({ row }) => {
        const itemId = row.original.id;
        return (
          <CheckboxControl
            size="small"
            checked={selectedItems.has(itemId)}
            className="cursor-default"
            onChange={() => {
              const newSelectedItems = new Set(selectedItems);
              if (selectedItems.has(itemId)) {
                newSelectedItems.delete(itemId);
              } else {
                newSelectedItems.add(itemId);
              }
              onSelectedItemsChange(newSelectedItems);
            }}
          />
        );
      },
      size: 45,
    };

    const fieldsArray = Array.isArray(selectedFields)
      ? selectedFields
      : Array.from(selectedFields);
    const orderableFieldsArray = Array.isArray(orderableFields)
      ? orderableFields
      : Array.from(orderableFields);

    return [
      checkboxColumn,
      ...fieldsArray.map((fieldKey) => {
        const field = list.fields[fieldKey];
        const { Cell } = field.views;
        const isOrderable = orderableFieldsArray.includes(fieldKey);

        return {
          accessorKey: fieldKey,
          header: () => (
            <div
              className={cn(
                "-mx-2 inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1",
                isOrderable
                  ? "hover:bg-gray-100 hover:dark:bg-gray-800"
                  : "cursor-default"
              )}
              onClick={() => {
                if (isOrderable) {
                  const direction =
                    sort?.field === fieldKey && sort.direction === "ASC"
                      ? "DESC"
                      : "ASC";
                  const newQuery = new URLSearchParams(query);
                  newQuery.set(
                    "sortBy",
                    `${direction === "DESC" ? "-" : ""}${fieldKey}`
                  );
                  window.history.pushState(null, "", `?${newQuery.toString()}`);
                  if (refetch) {
                    refetch();
                  }
                }
              }}
            >
              <span>{field.label}</span>
              {isOrderable && (
                <div className="-space-y-2">
                  <ChevronUp
                    className={cn(
                      "size-3.5 text-gray-900 dark:text-gray-50",
                      sort?.field === fieldKey && sort.direction === "ASC"
                        ? "text-blue-500"
                        : "opacity-30"
                    )}
                  />
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-gray-900 dark:text-gray-50",
                      sort?.field === fieldKey && sort.direction === "DESC"
                        ? "text-blue-500"
                        : "opacity-30"
                    )}
                  />
                </div>
              )}
            </div>
          ),
          cell: ({ row }) => {
            const item = row.original;
            const itemId = item.id;
            const itemForField = {};

            for (const graphqlField of getRootGraphQLFieldsFromFieldController(
              field.controller
            )) {
              if (
                item[graphqlField] === null ||
                item[graphqlField] === undefined
              ) {
                return (
                  <div className="flex">
                    <div className="font-mono text-xs rounded-sm px-2 py-1 border-dashed border italic">
                      null
                    </div>
                  </div>
                );
              }
              itemForField[graphqlField] = item[graphqlField];
            }

            return (
              <Cell
                field={field.controller}
                item={itemForField}
                linkTo={
                  Cell.supportsLinkTo
                    ? {
                        href: `/${list.path}/${encodeURIComponent(itemId)}`,
                      }
                    : undefined
                }
              />
            );
          },
          sortingFn: isOrderable ? "auto" : undefined,
        };
      }),
    ];
  }, [selectedItems, selectedFields, list.fields, orderableFields, sort]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="relative">
      <ScrollArea className="w-full whitespace-nowrap">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-y border-gray-200 dark:border-gray-800"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "whitespace-nowrap py-0",
                      header.column.columnDef.id === "selection"
                        ? "w-[64px] pl-5"
                        : "px-5",
                      header.column.columnDef.id !== "selection" &&
                        header.column.columnDef.accessorKey === sort?.field
                        ? "text-gray-900 dark:text-gray-50"
                        : "text-gray-700 dark:text-gray-300",
                      "text-sm font-medium"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "group select-none hover:bg-gray-50 hover:dark:bg-gray-900",
                  row.getIsSelected() && "bg-gray-50 dark:bg-gray-900"
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const isFirstColumn =
                    cell.column.columnDef.id === "selection";
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "relative whitespace-nowrap py-3",
                        isFirstColumn ? "w-[64px] pl-5" : "px-5",
                        row.getIsSelected() && "bg-gray-50 dark:bg-gray-900",
                        !isFirstColumn &&
                          "text-gray-600 dark:text-gray-400 text-sm"
                      )}
                    >
                      {isFirstColumn && row.getIsSelected() && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 dark:bg-blue-500" />
                      )}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export default ListTable;
