"use client"

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode } from 'react';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useDashboard } from '../context/DashboardProvider';
import { Pagination } from './Pagination';
import { getFieldViews } from '../views/registry';
import { deleteManyItemsAction } from '../actions/item-actions';

interface ListItem {
  id: string;
  [key: string]: unknown;
}

interface ListData {
  items: ListItem[];
  count: number;
}

interface ListTableProps {
  data: ListData;
  list: any; // Using Keystone's list structure
  selectedFields: Set<string>;
  currentPage: number;
  pageSize: number;
}

export function ListTable({
  data,
  list,
  selectedFields,
  currentPage,
  pageSize,
}: ListTableProps): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams() || new URLSearchParams();
  const { basePath } = useDashboard();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for selected items
  const [selectedItemsState, setSelectedItems] = useState<{
    itemsFromServer?: ListItem[];
    selectedItems: Set<string>;
  }>(() => ({
    itemsFromServer: undefined,
    selectedItems: new Set(),
  }));

  // Update selected items when data changes
  useEffect(() => {
    if (data.items && selectedItemsState.itemsFromServer !== data.items) {
      const newSelectedItems = new Set<string>();
      data.items.forEach(item => {
        if (selectedItemsState.selectedItems.has(item.id)) {
          newSelectedItems.add(item.id);
        }
      });
      setSelectedItems({
        itemsFromServer: data.items,
        selectedItems: newSelectedItems,
      });
    }
  }, [data.items, selectedItemsState.itemsFromServer, selectedItemsState.selectedItems]);

  const handleDelete = async () => {
    const idsToDelete = Array.from(selectedItemsState.selectedItems);
    console.log('Deleting items with IDs:', list);
    if (idsToDelete.length === 0) return;

    if (!list.gqlNames?.deleteManyMutationName) {
      toast.error('Delete functionality not available for this list');
      return;
    }

    setIsDeleteLoading(true);
    setError(null);
    try {
      const response = await deleteManyItemsAction(list.key, idsToDelete, {
        deleteManyMutationName: list.gqlNames.deleteManyMutationName,
        whereUniqueInputName: list.gqlNames.whereUniqueInputName,
      });

      if (response.errors.length > 0) {
        const errorMessage = response.errors[0].message;
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        toast.success(`Successfully deleted ${idsToDelete.length} ${idsToDelete.length === 1 ? list.singular : list.plural}`);
        setSelectedItems({
          itemsFromServer: selectedItemsState.itemsFromServer,
          selectedItems: new Set(),
        });
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleResetSelection = () => {
    setSelectedItems({
      itemsFromServer: selectedItemsState.itemsFromServer,
      selectedItems: new Set(),
    });
  };

  if (!data || !data.items) {
    return <div>No data available</div>;
  }

  // Create a query object that behaves like the old query object
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  // Function to render cell content based on field type - following Keystone's pattern
  const renderCellContent = (item: ListItem, fieldKey: string, isFirstField: boolean) => {
    const field = list.fields[fieldKey];
    if (!field) return null;

    // Handle ID field or first field - always linkable for text/string fields
    if (fieldKey === 'id' || (isFirstField && (field.viewsIndex === 0 || field.viewsIndex === 1))) {
      return (
        <Link 
          href={`${basePath}/${list.path}/${encodeURIComponent(item.id)}`}
          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
        >
          {item[fieldKey]?.toString() || item.id}
        </Link>
      );
    }

    // Get the appropriate Cell component and render it
    if (field.viewsIndex !== undefined) {
      try {
        const fieldViews = getFieldViews(field.viewsIndex);
        const CellComponent = fieldViews.Cell;
        
        if (CellComponent) {
          // Create linkTo prop for linkable cells
          const linkTo = (CellComponent as any).supportsLinkTo ? {
            href: `${basePath}/${list.path}/${encodeURIComponent(item.id)}`
          } : undefined;
          
          return (
            <CellComponent 
              field={field} 
              item={item} 
              linkTo={linkTo}
            />
          );
        }
      } catch (err) {
        console.warn(`Failed to render cell for field ${fieldKey}:`, err);
      }
    }

    // Fallback for fields without Cell components - handle null/undefined
    if (item[fieldKey] === null || item[fieldKey] === undefined) {
      return (
        <div 
          className="font-mono text-xs rounded-sm px-2 py-1 border-dashed border italic select-text"
          style={{ userSelect: 'text' }}
        >
          null
        </div>
      );
    }

    // Basic fallback for primitive values
    const value = item[fieldKey];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return (
        <span style={{ userSelect: 'text' }} className="select-text">
          {String(value)}
        </span>
      );
    }

    // For complex objects, show a placeholder instead of [object Object]
    return (
      <span className="text-muted-foreground italic text-xs">
        Complex data
      </span>
    );
  };

  const handleSort = (fieldKey: string) => {
    const field = list.fields[fieldKey];
    if (!field?.isOrderable) return;

    const currentSort = query.sortBy;
    const newSort = currentSort === fieldKey ? `-${fieldKey}` : fieldKey;

    const newSearchParams = new URLSearchParams(query);
    newSearchParams.set('sortBy', newSort);
    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  // Convert Set to Array for rendering
  const selectedFieldsArray = Array.from(selectedFields);

  return (
    <div className="relative">
      {error && (
        <Badge variant="destructive" className="hover:bg-destructive/10 bg-destructive/5 flex text-base items-start gap-2 border border-destructive/50 p-4 rounded-sm mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="uppercase tracking-wider font-semibold text-sm">Error</h2>
            <span className="break-all text-sm opacity-75 font-normal">{error}</span>
          </div>
        </Badge>
      )}

      {/* Single scrollable container with sticky header */}
      <div className="relative w-full border-y bg-background mb-18">
        <div className="relative overflow-auto" style={{ position: 'relative' }}>
          <table className="w-full border-collapse min-w-full">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                <th className="w-[64px] pl-6 bg-background text-left font-normal">
                  <Checkbox
                    checked={selectedItemsState.selectedItems.size === data.items.length}
                    onCheckedChange={(checked) => {
                      const newSelectedItems = new Set<string>();
                      if (checked) {
                        data.items.forEach(item => {
                          if (item && item.id) {
                            newSelectedItems.add(item.id);
                          }
                        });
                      }
                      setSelectedItems({
                        itemsFromServer: selectedItemsState.itemsFromServer,
                        selectedItems: newSelectedItems,
                      });
                    }}
                  />
                </th>
                {selectedFieldsArray.map((fieldKey: string) => {
                  const field = list.fields[fieldKey];
                  const sort = query.sortBy;
                  const sortField = sort?.startsWith('-') ? sort.slice(1) : sort;
                  const sortDirection = sort?.startsWith('-') ? 'DESC' : 'ASC';

                  return (
                    <th
                      key={fieldKey}
                      className={cn(
                        "whitespace-nowrap px-5 bg-background text-left",
                        fieldKey === sortField
                          ? "text-gray-900 dark:text-gray-50"
                          : "text-gray-700 dark:text-gray-300",
                        "text-sm font-medium"
                      )}
                    >
                      <button
                        onClick={() => handleSort(fieldKey)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md py-3",
                          field?.isOrderable
                            ? "hover:text-gray-900 dark:hover:text-gray-50"
                            : "cursor-default"
                        )}
                      >
                        <span>{field?.label || fieldKey}</span>
                        {field?.isOrderable && (
                          <div className="-space-y-2">
                            <ChevronUp
                              className={cn(
                                "size-3.5",
                                fieldKey === sortField && sortDirection === "ASC"
                                  ? "text-blue-500"
                                  : "opacity-30"
                              )}
                            />
                            <ChevronDown
                              className={cn(
                                "size-3.5",
                                fieldKey === sortField && sortDirection === "DESC"
                                  ? "text-blue-500"
                                  : "opacity-30"
                              )}
                            />
                          </div>
                        )}
                      </button>
                    </th>
                  );
                })}
                <th className="whitespace-nowrap py-3 px-5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-background text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((item: ListItem) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group hover:bg-muted",
                    selectedItemsState.selectedItems.has(item.id) && "bg-muted"
                  )}
                  style={{ userSelect: 'text' }}
                >
                  <td className="relative w-[64px] pl-6 py-3">
                    {selectedItemsState.selectedItems.has(item.id) && (
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 dark:bg-blue-500" />
                    )}
                    <Checkbox
                      checked={selectedItemsState.selectedItems.has(item.id)}
                      onCheckedChange={(checked) => {
                        const newSelectedItems = new Set(selectedItemsState.selectedItems);
                        if (checked) {
                          newSelectedItems.add(item.id);
                        } else {
                          newSelectedItems.delete(item.id);
                        }
                        setSelectedItems({
                          itemsFromServer: selectedItemsState.itemsFromServer,
                          selectedItems: newSelectedItems,
                        });
                      }}
                    />
                  </td>
                  {selectedFieldsArray.map((fieldKey: string, index) => (
                    <td
                      key={`${item.id}-${fieldKey}`}
                      className={cn(
                        "whitespace-nowrap py-3 px-5",
                        "text-gray-600 dark:text-gray-400 text-sm select-text"
                      )}
                      style={{ userSelect: 'text' }}
                    >
                      {renderCellContent(item, fieldKey, index === 0)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap py-3 px-5 text-sm text-gray-600 dark:text-gray-400">
                    <Link
                      href={`${basePath}/${list.path}/${item.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.items.length > 0 && (
        <Pagination
          currentPage={currentPage}
          total={data.count || 0}
          pageSize={pageSize}
          list={{
            singular: list.singular,
            plural: list.plural
          }}
          selectedItems={selectedItemsState.selectedItems}
          onResetSelection={handleResetSelection}
          onDelete={handleDelete}
          isDeleteLoading={isDeleteLoading}
        />
      )}
    </div>
  );
}