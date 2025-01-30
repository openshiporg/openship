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

  const columns = useMemo(() => {
    const checkboxColumn = {
      id: "selection",
      header: () => (
        <CheckboxControl
          size="small"
          checked={selectedItems.size === itemsGetter.data?.length}
          className="cursor-default"
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
      ...fieldsArray.map((fieldKey, i) => {
        const field = list.fields[fieldKey];
        const { Cell } = field.views;
        const isOrderable = orderableFieldsArray.includes(fieldKey);

        return {
          accessorKey: fieldKey,
          header: () => (
            <AdminLink
              href={{
                query: {
                  ...query,
                  sortBy:
                    sort?.field === fieldKey && sort.direction === "ASC"
                      ? `-${fieldKey}`
                      : fieldKey,
                },
              }}
              className="flex items-center justify-start gap-1"
            >
              {field.label}
              {/* Render sort direction arrow if this field is currently sorted */}
              {query.sortBy === fieldKey && <ChevronDown size={16} />}
              {query.sortBy === `-${fieldKey}` && <ChevronUp size={16} />}
            </AdminLink>
          ),
          cell: ({ row }) => {
            const item = row.original;
            const itemId = item.id;
            const itemForField = {};

            // Get the data for the fields from the item
            for (const graphqlField of getRootGraphQLFieldsFromFieldController(
              field.controller
            )) {
              if (
                item[graphqlField] === null ||
                item[graphqlField] === undefined
              ) {
                // Return an error message if there is an issue with the data
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

            // The following assumes that the item id is available on the row.original object
            // Now, render the Cell as you would in your original code
            return (
              <Cell
                field={field.controller}
                item={itemForField}
                linkTo={
                  i === 0 && Cell.supportsLinkTo
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
  }, [selectedItems, selectedFields, list.fields, orderableFields]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // You handle pagination on your own
    manualSorting: true, // You handle sorting on your own
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const works = [
    {
      artist: "Ornella Binni",
      art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80",
    },
    {
      artist: "Tom Byrom",
      art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
    },
    {
      artist: "Vladimir Malyavko",
      art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
    },
  ];
  return (
    <ScrollArea className="w-full whitespace-nowrap border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="text-nowrap text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase"
                  key={header.id}
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
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  className={`text-sm ${index === 1 && "font-medium"}`}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export default ListTable;
