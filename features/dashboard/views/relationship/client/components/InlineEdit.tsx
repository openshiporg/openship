"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateItemAction } from "@/features/dashboard/actions";
import { Fields } from "@/features/dashboard/components/Fields";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { useInvalidFields } from "@/features/dashboard/utils/useInvalidFields";
import {
  useHasChanges,
  serializeValueToOperationItem,
} from "@/features/dashboard/utils/useHasChanges";

interface InlineEditProps {
  list: any;
  fields: string[];
  item: any;
  onSave: (newItemData: any) => void;
  onCancel: () => void;
}

// Helper function to deserialize item data using enhanced fields (copied from ItemPageClient)
function deserializeItemToValue(
  enhancedFields: Record<string, any>,
  item: Record<string, unknown | null>
) {
  const result: Record<string, unknown | null> = {};

  Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
    try {
      // Enhanced fields already have controllers
      const controller = field.controller;

      // Create itemForField with only the GraphQL fields this controller needs
      const itemForField: Record<string, unknown> = {};
      // For now, just use the field path as the GraphQL field
      itemForField[field.path] = item?.[field.path] ?? null;

      // Call deserialize with the properly structured data
      result[fieldPath] = controller.deserialize(itemForField);
    } catch (error) {
      console.error(`Error deserializing field ${fieldPath}:`, error);
    }
  });

  return result;
}

export function InlineEdit({
  list,
  fields: fieldPaths,
  item,
  onSave,
  onCancel,
}: InlineEditProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forceValidation, setForceValidation] = useState(false);

  // Create enhanced fields for only the specified field paths
  const fields = useMemo(() => {
    const fieldsSubset: Record<string, any> = {};
    fieldPaths.forEach((fieldPath) => {
      if (list.fields[fieldPath]) {
        fieldsSubset[fieldPath] = list.fields[fieldPath];
      }
    });
    return enhanceFields(fieldsSubset, list.key);
  }, [list.fields, list.key, fieldPaths]);

  // Initialize value state with deserialized item data
  const initialValue = useMemo(() => {
    return deserializeItemToValue(fields, item);
  }, [fields, item]);

  const [value, setValue] = useState(() => initialValue);

  // Check if we have changes using our useHasChanges hook
  const hasChanges = useHasChanges("update", fields, value, initialValue);

  // Create isRequireds object from enhanced fields - exactly like ItemPage
  const isRequireds = useMemo(() => {
    const result: Record<string, any> = {};

    Object.entries(fields).forEach(([fieldPath, field]) => {
      result[fieldPath] = field.itemView?.isRequired || false;
    });

    return result;
  }, [fields]);

  const invalidFields = useInvalidFields(fields, value, isRequireds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      onCancel();
      return;
    }

    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);
    if (newForceValidation) return;

    setIsLoading(true);

    try {
      // Serialize the changes for update
      const dataForUpdate = serializeValueToOperationItem(
        "update",
        fields,
        value,
        initialValue
      );
      const result = await updateItemAction(list.key, item.id, dataForUpdate);

      // Check if there are no errors (success)
      if (result.errors.length === 0) {
        toast.success(`${item.label || item.id} updated successfully`);
        // Merge the updated data with the original item
        const updatedItem = { ...item, ...dataForUpdate };
        onSave(updatedItem);
      } else {
        // Handle errors
        const errorMessage =
          result.errors[0]?.message || "Failed to update item";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Fields
            list={list}
            fields={fields}
            value={value}
            onChange={setValue}
            forceValidation={forceValidation}
            invalidFields={invalidFields}
            isRequireds={isRequireds}
            view="itemView"
          />
        </div>

        <div className="flex gap-2 bg-muted/40 border rounded-lg p-2 justify-end">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
}
