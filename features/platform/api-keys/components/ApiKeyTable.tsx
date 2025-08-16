"use client"

import { useId, useMemo, useState } from "react"
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  MoreVerticalIcon,
  EditIcon,
  ShieldOffIcon,
  TrashIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import MultipleSelector, { Option } from "@/components/ui/multiselect"
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper"

declare module "@tanstack/react-table" {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select" | "multiselect"
  }
}

export interface ApiKey {
  id: string
  name: string
  tokenPreview: string
  scopes: string[]
  status: string
  expiresAt?: string
  lastUsedAt?: string
  usageCount?: { total: number; daily: Record<string, number> }
  restrictedToIPs?: string[]
  createdAt: string
  updatedAt?: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface ApiKeyTableProps {
  data: ApiKey[]
}

function getScopeColor(scope: string): string {
  // Map scopes to colors similar to the intents in the original component
  const scopeColors: Record<string, string> = {
    // Read scopes - blue tones
    "read_orders": "bg-indigo-400/20 text-indigo-500",
    "read_products": "bg-indigo-400/20 text-indigo-500", 
    "read_shops": "bg-indigo-400/20 text-indigo-500",
    "read_channels": "bg-indigo-400/20 text-indigo-500",
    "read_matches": "bg-indigo-400/20 text-indigo-500",
    "read_links": "bg-indigo-400/20 text-indigo-500",
    "read_platforms": "bg-indigo-400/20 text-indigo-500",
    "read_webhooks": "bg-indigo-400/20 text-indigo-500",
    "read_analytics": "bg-indigo-400/20 text-indigo-500",
    "read_users": "bg-indigo-400/20 text-indigo-500",
    
    // Write scopes - green tones  
    "write_orders": "bg-emerald-400/20 text-emerald-500",
    "write_products": "bg-emerald-400/20 text-emerald-500",
    "write_shops": "bg-emerald-400/20 text-emerald-500", 
    "write_channels": "bg-emerald-400/20 text-emerald-500",
    "write_matches": "bg-emerald-400/20 text-emerald-500",
    "write_links": "bg-emerald-400/20 text-emerald-500",
    "write_platforms": "bg-emerald-400/20 text-emerald-500",
    "write_webhooks": "bg-emerald-400/20 text-emerald-500",
    "write_users": "bg-emerald-400/20 text-emerald-500",
  }
  
  return scopeColors[scope] || "bg-gray-400/20 text-gray-500"
}

function getScopeAbbreviation(scope: string): string {
  const parts = scope.split('_')
  if (parts.length >= 2) {
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
  }
  return scope.substring(0, 2).toUpperCase()
}

export default function ApiKeyTable({ data }: ApiKeyTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "createdAt",
      desc: true,
    },
  ])
  const [editDrawerOpen, setEditDrawerOpen] = useState<{ open: boolean; itemId?: string }>({
    open: false
  })

  // Get all unique scopes for the multiselect filter
  const allScopes = useMemo(() => {
    const scopeSet = new Set<string>()
    data.forEach(apiKey => {
      apiKey.scopes.forEach(scope => scopeSet.add(scope))
    })
    return Array.from(scopeSet).sort().map(scope => ({
      value: scope,
      label: scope.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  }, [data])

  const columns: ColumnDef<ApiKey>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const apiKey = row.original
        const usageCount = apiKey.usageCount?.total || 0
        const isExpired = apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{apiKey.name}</div>
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {apiKey.tokenPreview}
              </code>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge 
                variant={apiKey.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {apiKey.status}
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
              <span className="text-muted-foreground">
                {usageCount} request{usageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      header: "Scopes",
      accessorKey: "scopes",
      cell: ({ row }) => {
        const scopes = row.getValue("scopes") as string[]
        return (
          <div className="flex gap-1 flex-wrap max-w-xs">
            {scopes.slice(0, 4).map((scope) => {
              const styles = getScopeColor(scope)
              return (
                <div
                  key={scope}
                  className={cn(
                    "flex size-6 items-center justify-center rounded text-xs font-medium",
                    styles
                  )}
                  title={scope.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                >
                  {getScopeAbbreviation(scope)}
                </div>
              )
            })}
            {scopes.length > 4 && (
              <div className="flex size-6 items-center justify-center rounded text-xs font-medium bg-gray-400/20 text-gray-500">
                +{scopes.length - 4}
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
      meta: {
        filterVariant: "multiselect",
      },
      filterFn: (row, id, filterValue) => {
        const rowValue = row.getValue(id) as string[]
        const filterValues = filterValue as string[]
        if (!filterValues || filterValues.length === 0) return true
        return filterValues.some(filterVal => rowValue.includes(filterVal))
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const apiKey = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditDrawerOpen({ open: true, itemId: apiKey.id })
                }}
              >
                <EditIcon className="mr-2 h-4 w-4" />
                Edit key
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Placeholder for revoke functionality
                  console.log('Revoke API key:', apiKey.id)
                }}
                disabled={apiKey.status === 'revoked'}
              >
                <ShieldOffIcon className="mr-2 h-4 w-4" />
                Revoke key
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Placeholder for delete functionality
                  console.log('Delete API key:', apiKey.id)
                }}
                className="text-destructive"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search input */}
        <div className="w-64">
          <Filter column={table.getColumn("name")!} />
        </div>
        {/* Scopes multiselect */}
        <div className="w-64">
          <Filter column={table.getColumn("scopes")!} options={allScopes} />
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="relative h-10 border-t select-none"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                            "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (
                            header.column.getCanSort() &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault()
                            header.column.getToggleSortingHandler()?.(e)
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: (
                            <ChevronUpIcon
                              className="shrink-0 opacity-60"
                              size={16}
                              aria-hidden="true"
                            />
                          ),
                          desc: (
                            <ChevronDownIcon
                              className="shrink-0 opacity-60"
                              size={16}
                              aria-hidden="true"
                            />
                          ),
                        }[header.column.getIsSorted() as string] ?? (
                          <span className="size-4" aria-hidden="true" />
                        )}
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No API keys found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit Drawer */}
      <EditItemDrawerClientWrapper
        listKey="apiKeys"
        itemId={editDrawerOpen.itemId}
        open={editDrawerOpen.open}
        onClose={() => setEditDrawerOpen({ open: false })}
      />
    </div>
  )
}

function Filter({ 
  column, 
  options 
}: { 
  column: Column<any, unknown>
  options?: Option[]
}) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}
  const columnHeader =
    typeof column.columnDef.header === "string" ? column.columnDef.header : ""

  if (filterVariant === "multiselect" && options) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${id}-multiselect`}>{columnHeader}</Label>
        <MultipleSelector
          value={
            columnFilterValue
              ? (columnFilterValue as string[]).map(val => 
                  options.find(opt => opt.value === val) || { value: val, label: val }
                )
              : []
          }
          onChange={(selected) => {
            const values = selected.map(option => option.value)
            column.setFilterValue(values.length > 0 ? values : undefined)
          }}
          defaultOptions={options}
          placeholder="Filter by scopes..."
          emptyIndicator={
            <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
              No scopes found.
            </p>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-input`}>Search</Label>
      <div className="relative">
        <Input
          id={`${id}-input`}
          className="peer ps-9"
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder="Search API keys..."
          type="text"
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <SearchIcon size={16} />
        </div>
      </div>
    </div>
  )
}