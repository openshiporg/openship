"use client";

import React, { Fragment } from "react";
import { useListQuery } from "@/features/dashboard/hooks/useList.query";
import { useAuthenticatedUserQuery } from "@/features/dashboard/hooks/useAuth.query";
import { RelationshipSelect } from "./components/RelationshipSelect";
import { Cards } from "./components/Cards";
import { CreateItemDrawer } from "./components/CreateItemDrawer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface FieldProps {
  field: {
    refListKey: string;
    listKey?: string;
    many?: boolean;
    refLabelField: string;
    refSearchFields?: string[];
    refFieldKey?: string;
    path: string;
    label: string;
    description?: string;
    display?: string;
    hideCreate?: boolean;
    hideButtons?: boolean;
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
  value: any;
  onChange: (value: any) => void;
  autoFocus?: boolean;
  isDisabled?: boolean;
  forceValidation?: boolean;
}

function LinkToRelatedItems({ itemId, value, list, refFieldKey }: any) {
  function constructQuery({ refFieldKey, itemId, value }: any) {
    if (!!refFieldKey && itemId) {
      return `!${refFieldKey}_matches="${itemId}"`;
    }
    return `!id_in="${(value?.value ?? [])
      .slice(0, 100)
      .map(({ id }: any) => id)
      .join(",")}"`;
  }

  if (value?.kind === "many") {
    const query = constructQuery({ refFieldKey, value, itemId });
    return (
      <Button variant="ghost">
        <Link href={`/dashboard/${list?.path ?? ''}?${query}`}>View related {list?.plural ?? 'items'}</Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost">
      <Link href={`/dashboard/${list?.path ?? ''}/${value?.value?.id ?? ''}`}>
        View {list?.singular ?? 'item'} details
      </Link>
    </Button>
  );
}

export function ClientField({
  field,
  value,
  onChange,
  autoFocus,
  isDisabled,
  forceValidation,
}: FieldProps) {
  // Get list data using React Query
  const { data: foreignList, isLoading: foreignListLoading, error: foreignListError } = useListQuery(field.refListKey);

  const { data: localList, isLoading: localListLoading, error: localListError } = useListQuery(
    field.listKey || field.refListKey
  );

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Use React Query for authenticated item
  const { data: authData, error: authError } = useAuthenticatedUserQuery();

  // Handle auth error state
  if (authError) {
    console.error("Error fetching authenticated user:", authError);
  }

  const authenticatedItem =
    authData?.authenticatedItem
      ? {
          id: authData.authenticatedItem.id,
          label:
            authData.authenticatedItem.name ||
            authData.authenticatedItem.email,
          listKey: "User", // Assuming the listKey is always 'User' for authenticated items
          state: "authenticated" as const,
        }
      : { state: "unauthenticated" as const };

  // Show loading state while lists are loading
  if (foreignListLoading || localListLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Show error state if lists failed to load
  if (foreignListError || localListError) {
    return (
      <div className="text-red-500">
        Error loading relationship data: {foreignListError?.message || localListError?.message}
      </div>
    );
  }

  if (value?.kind === "cards-view") {
    return (
      <Fragment>
        {foreignList && localList && (
          <Cards
            list={localList}
            field={{
              refListKey: field.refListKey,
              refLabelField: field.refLabelField || 'id',
              refSearchFields: field.refSearchFields,
              many: field.many,
              label: field.label,
              path: field.path,
              displayOptions: field.displayOptions
            }}
            value={value}
            onChange={onChange}
            foreignList={foreignList}
            forceValidation={forceValidation}
          />
        )}
      </Fragment>
    );
  }

  if (value?.kind === "count") {
    return (
      <div>
        {foreignList && localList && (
          <Fragment>
            {value.count === 1
              ? `There is 1 ${foreignList?.singular ?? 'item'} `
              : `There are ${value.count} ${foreignList?.plural ?? 'items'} `}
            linked to this {localList?.singular ?? 'item'}
          </Fragment>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RelationshipSelect
        list={foreignList}
        labelField={field?.refLabelField ?? 'id'}
        searchFields={field?.refSearchFields}
        state={
          value?.kind === "many"
            ? {
                kind: "many",
                value: value?.value ?? [],
                onChange(newItems) {
                  onChange?.({
                    ...value,
                    value: newItems,
                  });
                },
              }
            : {
                kind: "one",
                value: value?.value ?? null,
                onChange(newVal) {
                  if (value?.kind === "one") {
                    onChange?.({
                      ...value,
                      value: newVal,
                    });
                  }
                },
              }
        }
        isDisabled={isDisabled}
        autoFocus={autoFocus}
      />

      {!field?.hideButtons && (
        <div className="flex gap-2 flex-wrap">
          {foreignList && (
            <Fragment>
              {!field?.hideCreate && onChange !== undefined && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    Create related {foreignList.singular}
                  </Button>
                  <CreateItemDrawer
                    listKey={foreignList.key}
                    isOpen={isDrawerOpen}
                    onClose={() => {
                      setIsDrawerOpen(false);
                    }}
                    onCreate={(val) => {
                      setIsDrawerOpen(false);
                      if (value?.kind === "many") {
                        onChange({
                          ...value,
                          value: [...(value?.value ?? []), val],
                        });
                      } else if (value?.kind === "one") {
                        onChange({
                          ...value,
                          value: val,
                        });
                      }
                    }}
                  />
                </>
              )}

              {onChange !== undefined &&
                authenticatedItem?.state === "authenticated" &&
                authenticatedItem.listKey === field?.refListKey &&
                (value?.kind === "many"
                  ? value?.value.find(
                      (x: { id: string }) => x.id === authenticatedItem.id
                    ) === undefined
                  : value?.value?.id !== authenticatedItem.id) && (
                  <Button
                    onClick={() => {
                      const val = {
                        label: authenticatedItem.label,
                        id: authenticatedItem.id,
                      };
                      if (value?.kind === "many") {
                        onChange({
                          ...value,
                          value: [...(value?.value ?? []), val],
                        });
                      } else {
                        onChange({
                          ...value,
                          value: val,
                        });
                      }
                    }}
                  >
                    {value?.kind === "many" ? "Add " : "Set as "}
                    {authenticatedItem.label}
                  </Button>
                )}

              {value?.value && (
                <LinkToRelatedItems
                  itemId={value?.id}
                  value={value}
                  list={foreignList}
                  refFieldKey={field?.refFieldKey}
                />
              )}
            </Fragment>
          )}
        </div>
      )}
    </div>
  );
}
