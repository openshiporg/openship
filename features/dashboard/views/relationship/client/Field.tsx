"use client";

import React, { Fragment } from "react";
import useSWR from "swr";
import { getAuthenticatedUser } from "@/features/dashboard/actions/auth";
import { getList } from "@/features/dashboard/actions/getList";
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
  // Get list data using getList for relationships
  const { data: foreignListData } = useSWR(
    `list-${field.refListKey}`,
    async () => {
      return await getList(field.refListKey);
    }
  );

  const { data: localListData } = useSWR(
    `list-${field.listKey || field.refListKey}`,
    async () => {
      return await getList(field.listKey || field.refListKey);
    }
  );

  const foreignList = foreignListData;
  const localList = localListData;

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Use SWR for authenticated item
  const { data: authResponse, error: swrError } = useSWR(
    "authenticated-item",
    async () => {
      const response = await getAuthenticatedUser();
      if (!response.success) {
        console.error("Failed to get authenticated user:", response.error);
        // Optionally throw an error to be caught by SWR's error handling
        // throw new Error(response.error);
      }
      return response;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  // Handle SWR error state
  if (swrError) {
    console.error("SWR error fetching authenticated user:", swrError);
  }

  const authenticatedItem =
    authResponse?.success && authResponse.data?.authenticatedItem
      ? {
          id: authResponse.data.authenticatedItem.id,
          label:
            authResponse.data.authenticatedItem.name ||
            authResponse.data.authenticatedItem.email,
          listKey: "User", // Assuming the listKey is always 'User' for authenticated items
          state: "authenticated",
        }
      : { state: "unauthenticated" };

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
