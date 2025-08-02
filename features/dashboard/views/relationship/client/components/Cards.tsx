"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
import { FieldContainer } from "@/components/ui/field-container";
import { FieldLabel } from "@/components/ui/field-label";
import { RelationshipSelect } from "./RelationshipSelect";
import { InlineCreate } from "./InlineCreate";
import { InlineEdit } from "./InlineEdit";
import { getItemAction } from "@/features/dashboard/actions/getItemAction";
import useSWR from "swr";
import Link from "next/link";
import { Fields } from "@/features/dashboard/components/Fields";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { getFieldViews } from "@/features/dashboard/views/registry";

interface CardsProps {
  field: {
    refListKey: string;
    refLabelField: string;
    refSearchFields?: string[];
    many?: boolean;
    label: string;
    path: string;
    isRequired?: boolean;
    hideCreate?: boolean;
    displayOptions?: {
      cardFields: string[];
      inlineCreate?: {
        fields: string[];
      };
      inlineEdit?: {
        fields: string[];
      };
      linkToItem?: boolean;
      removeMode?: "disconnect";
      inlineConnect?: boolean;
    };
  };
  value: {
    kind: "cards-view";
    currentIds: Set<string>;
    id: string | null;
    initialIds: Set<string>;
    itemBeingCreated: boolean;
    itemsBeingEdited: Set<string>;
    displayOptions: {
      cardFields: string[];
      linkToItem: boolean;
      removeMode: "disconnect" | "none";
      inlineCreate: { fields: string[] } | null;
      inlineEdit: { fields: string[] } | null;
      inlineConnect: boolean;
    };
  };
  list: any;
  foreignList: any;
  forceValidation?: boolean;
  autoFocus?: boolean;
  onChange?: (newValue: any) => void;
  isDisabled?: boolean;
}

interface CardContainerProps {
  children: React.ReactNode;
  mode: "view" | "create" | "edit";
  className?: string;
}

function CardContainer({
  children,
  mode = "view",
  className = "",
}: CardContainerProps) {
  const borderColor =
    mode === "edit"
      ? "border-l-blue-500"
      : mode === "create"
      ? "border-l-green-500"
      : "border-l-gray-300";

  return (
    <div className={`relative border p-4 rounded-xl ${className}`}>
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded ${borderColor}`}
      />
      {children}
    </div>
  );
}

export function Cards({
  field,
  value,
  foreignList,
  onChange,
  forceValidation = false,
  isDisabled = false,
}: CardsProps) {
  const [showConnectItems, setShowConnectItems] = useState(false);
  const [hideConnectItemsLabel, setHideConnectItemsLabel] = useState<
    "Cancel" | "Done"
  >("Cancel");
  const [items, setItems] = useState<Record<string, any>>({});
  const editRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(false);

  // Build selectedFields like Keystone does
  const { displayOptions } = value;
  
  const selectedFields = [
    ...new Set([
      ...displayOptions.cardFields,
      ...(displayOptions.inlineEdit?.fields || []),
    ]),
  ]
    .map((fieldPath) => {
      const field = foreignList.fields[fieldPath];
      if (!field) return fieldPath;
      
      // Get the field controller with graphqlSelection
      const fieldViews = getFieldViews(field.viewsIndex);
      const controller = fieldViews.controller(field);
      
      return controller?.graphqlSelection || fieldPath;
    })
    .join("\n");

  // Also include id and the proper label field if not already included
  const labelField = field.refLabelField || foreignList.labelField || "id";
  const finalSelectedFields = `
    id
    ${labelField !== "id" ? `label: ${labelField}` : ""}
    ${selectedFields}
  `;

  // Handle Set serialization issue when passing from server to client
  const currentIds =
    value.currentIds instanceof Set
      ? value.currentIds
      : new Set(Array.isArray(value.currentIds) ? value.currentIds : []);
  const itemsBeingEdited =
    value.itemsBeingEdited instanceof Set
      ? value.itemsBeingEdited
      : new Set(
          Array.isArray(value.itemsBeingEdited) ? value.itemsBeingEdited : []
        );

  const currentIdsArray = Array.from(currentIds);
  const { data: itemsData, error: swrError } = useSWR(
    currentIdsArray.length > 0
      ? `cards-items-${field.refListKey}-${currentIdsArray.join(",")}`
      : null,
    async () => {
      const itemPromises = currentIdsArray.map(async (itemId) => {
        const result = await getItemAction(foreignList, itemId);
        if (result.success) {
          return { id: itemId, data: result.data.item };
        }
        return null;
      });

      const results = await Promise.all(itemPromises);
      return results.filter(Boolean);
    }
  );

  // Update items state when data changes
  useEffect(() => {
    if (itemsData) {
      const newItems: Record<string, any> = {};
      itemsData.forEach((result: any) => {
        if (result && result.data) {
          newItems[result.id] = result.data;
        }
      });
      setItems(newItems);
    }
  }, [itemsData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  });

  useEffect(() => {
    if (value.itemsBeingEdited && editRef.current) {
      editRef.current.focus();
    }
  }, [value]);

  const isReadOnly = !onChange || isDisabled;

  // Convert currentIds to array with items
  const currentIdsArrayWithFetchedItems = Array.from(currentIds)
    .map((id) => ({ id, item: items[id] }))
    .filter((x) => x.item);

  // Handle removing items
  const handleRemoveItem = (itemId: string) => {
    if (!onChange || isReadOnly) return;

    const newCurrentIds = new Set(currentIds);
    newCurrentIds.delete(itemId);
    onChange({
      ...value,
      currentIds: newCurrentIds,
    });
  };

  // Handle edit mode toggle
  const handleEditItem = (itemId: string) => {
    if (!onChange) return;

    onChange({
      ...value,
      itemsBeingEdited: new Set([...itemsBeingEdited, itemId]),
    });
  };

  // Handle save after edit
  const handleSaveEdit = (itemId: string, newItemData: any) => {
    const newItems = { ...items, [itemId]: newItemData };
    setItems(newItems);

    const newItemsBeingEdited = new Set(itemsBeingEdited);
    newItemsBeingEdited.delete(itemId);
    onChange?.({
      ...value,
      itemsBeingEdited: newItemsBeingEdited,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = (itemId: string) => {
    const newItemsBeingEdited = new Set(itemsBeingEdited);
    newItemsBeingEdited.delete(itemId);
    onChange?.({
      ...value,
      itemsBeingEdited: newItemsBeingEdited,
    });
  };

  // Handle inline create
  const handleCreateItem = (newItemData: any) => {
    const id = newItemData.id;
    setItems({ ...items, [id]: newItemData });
    onChange?.({
      ...value,
      itemBeingCreated: false,
      currentIds: field.many ? new Set([...currentIds, id]) : new Set([id]),
    });
  };

  // Create enhanced fields for card display
  const cardFields = useMemo(() => {
    if (!foreignList?.fields) return {};

    // Filter to only card fields and enhance them
    const filteredFields: Record<string, any> = {};
    displayOptions.cardFields.forEach((fieldPath) => {
      if (foreignList.fields[fieldPath]) {
        filteredFields[fieldPath] = foreignList.fields[fieldPath];
      }
    });

    return enhanceFields(filteredFields, foreignList.key);
  }, [foreignList, displayOptions.cardFields]);

  // Deserialize item data for each card field
  const getFieldValue = useCallback(
    (item: any, fieldPath: string) => {
      const field = cardFields[fieldPath];
      if (!field?.controller) return null;

      const itemForField: Record<string, unknown> = {};
      itemForField[fieldPath] = item[fieldPath] ?? null;

      return field.controller.deserialize(itemForField);
    },
    [cardFields]
  );

  return (
    <div className="space-y-4">
      {/* Existing Cards */}
      {currentIdsArrayWithFetchedItems.length > 0 && (
        <ul className="space-y-4 list-none p-0 m-0">
          {currentIdsArrayWithFetchedItems.map(({ id, item }, index) => {
            const isEditMode = !isReadOnly && itemsBeingEdited.has(id);

            return (
              <li key={id}>
                <CardContainer mode={isEditMode ? "edit" : "view"}>
                  <div className="sr-only">
                    <h2>{`${field.label} ${index + 1} ${
                      isEditMode ? "edit" : "view"
                    } mode`}</h2>
                  </div>

                  {isEditMode ? (
                    <InlineEdit
                      list={foreignList}
                      fields={displayOptions.inlineEdit!.fields}
                      item={item}
                      onSave={(newItemData) => handleSaveEdit(id, newItemData)}
                      onCancel={() => handleCancelEdit(id)}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Card Fields using Fields component */}
                      <Fields
                        list={foreignList}
                        fields={cardFields}
                        value={Object.fromEntries(
                          displayOptions.cardFields.map((fieldPath) => [
                            fieldPath,
                            getFieldValue(item, fieldPath),
                          ])
                        )}
                        onChange={undefined}
                        forceValidation={false}
                        invalidFields={new Set()}
                        isRequireds={{}}
                      />

                      {/* Card Actions */}
                      <div className="flex gap-2 flex-wrap bg-muted/40 border rounded-lg p-2 justify-end">
                        {displayOptions.linkToItem && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/${foreignList.path}/${id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View {foreignList.singular} details
                            </Link>
                          </Button>
                        )}

                        {displayOptions.removeMode === "disconnect" &&
                          !isReadOnly && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(id)}
                              title="This item will not be deleted. It will only be removed from this field."
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}

                        {displayOptions.inlineEdit && !isReadOnly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(id)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContainer>
              </li>
            );
          })}
        </ul>
      )}

      {/* Inline Connect Mode */}
      {!isReadOnly && displayOptions.inlineConnect && showConnectItems ? (
        <CardContainer mode="edit">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <RelationshipSelect
                list={foreignList}
                labelField={field.refLabelField}
                searchFields={field.refSearchFields}
                state={{
                  kind: "many",
                  value: Array.from(currentIds).map((id) => ({
                    id,
                    label: items[id]?.label || id,
                  })),
                  onChange: (newItems: { id: string; label: string }[]) => {
                    // TODO: Handle connecting existing items
                    const newCurrentIds = field.many
                      ? new Set(currentIds)
                      : new Set<string>();
                    newItems.forEach((item: { id: string; label: string }) =>
                      newCurrentIds.add(item.id)
                    );
                    onChange?.({
                      ...value,
                      currentIds: newCurrentIds,
                    });
                    setHideConnectItemsLabel("Done");
                  },
                }}
                autoFocus
                placeholder={`Select a ${foreignList.singular}`}
              />
            </div>
            <Button size="sm" onClick={() => setShowConnectItems(false)}>
              {hideConnectItemsLabel}
            </Button>
          </div>
        </CardContainer>
      ) : value.itemBeingCreated ? (
        /* Inline Create Mode */
        <CardContainer mode="create">
          <InlineCreate
            list={foreignList}
            fields={displayOptions.inlineCreate!.fields}
            selectedFields={finalSelectedFields}
            onCancel={() => {
              onChange?.({ ...value, itemBeingCreated: false });
            }}
            onCreate={handleCreateItem}
          />
        </CardContainer>
      ) : (displayOptions.inlineCreate || displayOptions.inlineConnect) &&
        !isReadOnly ? (
        /* Create/Connect Actions */
        <CardContainer mode="create">
          <div className="flex gap-2">
            {displayOptions.inlineCreate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onChange?.({
                    ...value,
                    itemBeingCreated: true,
                  });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create {foreignList.singular}
              </Button>
            )}

            {displayOptions.inlineConnect && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowConnectItems(true);
                  setHideConnectItemsLabel("Cancel");
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Link existing {foreignList.singular}
              </Button>
            )}
          </div>
        </CardContainer>
      ) : null}

      {/* Validation Error */}
      {forceValidation && (
        <p className="text-sm text-red-600">
          You must finish creating and editing any related{" "}
          {foreignList.label?.toLowerCase() || "items"} before saving the{" "}
          {foreignList.singular?.toLowerCase() || "item"}
        </p>
      )}
    </div>
  );
}
