"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createItemAction } from "@/features/dashboard/actions";
import { Fields } from "@/features/dashboard/components/Fields";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { useInvalidFields } from "@/features/dashboard/utils/useInvalidFields";
import { serializeValueToOperationItem } from "@/features/dashboard/utils/useHasChanges";

interface InlineCreateProps {
  list: any;
  fields: string[];
  selectedFields: string;
  onCancel: () => void;
  onCreate: (itemData: any) => void;
}

export function InlineCreate({
  list,
  fields: fieldPaths,
  selectedFields,
  onCancel,
  onCreate,
}: InlineCreateProps) {
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

  // Initialize value state with default values from field controllers
  const [value, setValue] = useState(() => {
    const initialValue: Record<string, any> = {};
    Object.keys(fields).forEach((fieldPath) => {
      // Use the controller's defaultValue directly (it's already in the correct format)
      initialValue[fieldPath] = fields[fieldPath].controller.defaultValue;
    });
    return initialValue;
  });

  // Create isRequireds object from enhanced fields - exactly like ItemPage
  const isRequireds = useMemo(() => {
    const result: Record<string, any> = {};

    Object.entries(fields).forEach(([fieldPath, field]) => {
      result[fieldPath] = field.createView?.isRequired || false;
    });

    return result;
  }, [fields]);

  const invalidFields = useInvalidFields(fields, value, isRequireds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);

    if (newForceValidation) return;

    setIsLoading(true);

    try {
      // Serialize field values for create operation
      const data = serializeValueToOperationItem("create", fields, value);

      // Use the selectedFields passed from Cards component
      const result = await createItemAction(list.key, data, selectedFields, {
        skipRevalidation: true,
      });

      // Check if there are no errors (success)
      if (result.errors.length === 0) {
        toast.success(
          `${
            result.data?.item?.label || result.data?.item?.id
          } created successfully`
        );
        onCreate(result.data.item);
      } else {
        // Handle errors
        const errorMessage =
          result.errors[0]?.message || "Failed to create item";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to create item");
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
            view="createView"
          />
        </div>
        <div className="flex gap-2 bg-muted/40 border rounded-lg p-2 justify-end">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? "Creating..." : `Create ${list.singular}`}
          </Button>
        </div>
      </form>
    </section>
  );
}
