"use client";
import { Fragment, useState } from "react";
import useSWR from "swr";
import { getRelationshipOptions } from "@/features/dashboard/actions/relationship";
import { RelationshipSelect } from "./client/components/RelationshipSelect";
import { ClientField } from "./client/Field";
import Link from "next/link";
import { useList } from "@/features/dashboard/hooks/useAdminMeta";
import { basePath } from "@/features/dashboard/lib/config";
import { FieldContainer } from "@/components/ui/field-container";
import { FieldLabel } from "@/components/ui/field-label";
import { FieldDescription } from "@/components/ui/field-description";
import { ClientRelationshipFilter } from "./ClientRelationshipFilter";

const CellContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;

export const Field = ({
  field,
  autoFocus,
  value,
  onChange,
  forceValidation,
  authenticatedItem,
  foreignList,
  localList,
}: {
  field: any;
  autoFocus?: boolean;
  value: any;
  onChange: (value: any) => void;
  forceValidation?: boolean;
  authenticatedItem: any;
  foreignList: any;
  localList: any;
}) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <ClientField
        field={field}
        value={value}
        onChange={onChange}
        forceValidation={forceValidation}
      />
    </FieldContainer>
  );
};

export const Cell = ({ field, item }: { field: any; item: any }) => {
  const { list } = useList(field.fieldMeta.refListKey) || { list: undefined };

  if (field.display === "count") {
    const count = item[`${field.path}Count`] ?? 0;
    return (
      <CellContainer>
        {count} {count === 1 ? list?.singular || 'item' : list?.plural || 'items'}
      </CellContainer>
    );
  }

  const data = item[field.path];
  if (!data) {
    return <CellContainer>
      <span className="text-muted-foreground">—</span>
    </CellContainer>;
  }

  const items = (Array.isArray(data) ? data : [data]).filter((item) => item);
  if (items.length === 0) {
    return <CellContainer>
      <span className="text-muted-foreground">—</span>
    </CellContainer>;
  }

  const displayItems = items.length < 3 ? items : items.slice(0, 2);
  const overflow = items.length < 3 ? 0 : items.length - 2;

  return (
    <CellContainer>
      {displayItems.map((item: any, index: number) => (
        <Fragment key={item.id}>
          {!!index ? ", " : ""}
          <Link href={`${basePath}/${list?.path || ''}/${item.id}`}>
            {item.label || item.id}
          </Link>
        </Fragment>
      ))}
      {overflow > 0 && (
        <span className="opacity-50 font-medium">
          {`, and ${overflow} more`}
        </span>
      )}
    </CellContainer>
  );
};

export const CardValue = ({
  field,
  item,
  list,
}: {
  field: any;
  item: any;
  list: any;
}) => {
  const data = item[field.path];
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {(Array.isArray(data) ? data : [data])
        .filter((item) => item)
        .map((item: any, index: number) => (
          <Fragment key={item.id}>
            {!!index ? ", " : ""}
            {item.label || item.id}
          </Fragment>
        ))}
    </FieldContainer>
  );
};

function getForeignIds(value: any) {
  if (typeof value === "string" && value.length > 0) {
    return value.split(",");
  }
  return [];
}

// Modified version of useRelationshipFilterValues that can accept prefetched data
function useRelationshipFilterValues({
  value,
  list,
  prefetchedValues,
}: {
  value: any;
  list: any;
  prefetchedValues?: any[];
}) {
  const foreignIds = getForeignIds(value);
  const where = { id: { in: foreignIds } };

  // If prefetched values are provided, use them
  if (prefetchedValues) {
    return {
      filterValues: prefetchedValues,
      loading: false,
    };
  }

  // Otherwise use SWR to fetch the data
  const { data, error } = useSWR(
    foreignIds.length && list
      ? [`relationship-filter-${list.key}`, foreignIds.join(",")] // Ensure key is stable string
      : null,
    async () => {
      // Use a safe way to access list query name
      const listQueryName =
        list.gqlNames?.listQueryName || `${list.key.toLowerCase()}s`;

      // Use a safe way to access where input name
      const whereInputName =
        list.gqlNames?.whereInputName || `${list.key}WhereInput`;

      // Use the labelField if available, otherwise default to 'name'
      const labelField = list.labelField || "name";

      const result = await getRelationshipOptions(
        list.key,
        where,
        foreignIds.length,
        0,
        labelField,
        "", // No extra selection needed here for filter values
        {
          whereInputName,
          listQueryName,
          listQueryCountName:
            list.gqlNames?.listQueryCountName || `${listQueryName}Count`,
        }
      );

      if (result.success) {
        // Return the items array directly on success, default to empty array
        return result.success && 'data' in result ? (result.data?.items ?? []) : [];
      } else {
        console.error("Error fetching relationship filter values:", result.error);
        // Throw error for SWR to catch
        throw new Error(result.error || "Failed to fetch relationship filter values");
      }
    }
  );

  const loading = !data && !error;
  const labelField = list.labelField || "name";

  // Process the data returned by SWR (which is the items array on success)
  const resolvedFilterValues = data
    ? data.map((item: any) => ({
        id: item.id,
        label: item[labelField] || item.id,
      }))
    : foreignIds.map((f: string) => ({ label: f, id: f })); // Fallback if data is not yet loaded or error occurred

  return {
    filterValues: resolvedFilterValues,
    loading,
  };
}

// Standalone Filter component that can be used from server components
export const Filter = ({
  onChange,
  value,
  filterValues,
  list,
  refLabelField,
  refSearchFields,
}: {
  onChange: any;
  value: any;
  filterValues?: any[];
  list: any;
  refLabelField: string;
  refSearchFields: string[];
}) => {
  const { filterValues: resolvedFilterValues, loading } =
    useRelationshipFilterValues({
      value,
      list,
      prefetchedValues: filterValues,
    });
  const state = {
    kind: "many" as const,
    value: resolvedFilterValues,
    onChange(newItems: any[]) {
      onChange(newItems.map((item: any) => item.id).join(","));
    },
  };
  // Add the missing props required by RelationshipSelect
  return (
    <RelationshipSelect
      controlShouldRenderValue
      list={list}
      labelField={refLabelField}
      searchFields={refSearchFields}
      state={state}
    />
  );
};

export const controller = (config: {
  path: string;
  label: string;
  description?: string;
  listKey: string;
  fieldMeta: {
    refListKey: string;
    refLabelField?: string;
    refSearchFields?: string[];
    refFieldKey?: string;
    many?: boolean;
    displayMode?: "cards" | "count";
    cardFields?: string[];
    inlineCreate?: boolean;
    inlineEdit?: boolean;
    linkToItem?: boolean;
    removeMode?: "disconnect" | "none";
    inlineConnect?: boolean;
    hideCreate?: boolean;
    hideButtons?: boolean;
  };
}) => {
  const cardsDisplayOptions =
    config.fieldMeta.displayMode === "cards"
      ? {
          cardFields: config.fieldMeta.cardFields,
          inlineCreate: config.fieldMeta.inlineCreate,
          inlineEdit: config.fieldMeta.inlineEdit,
          linkToItem: config.fieldMeta.linkToItem,
          removeMode: config.fieldMeta.removeMode,
          inlineConnect: config.fieldMeta.inlineConnect,
        }
      : undefined;

  const refLabelField = config.fieldMeta.refLabelField;
  const refSearchFields = config.fieldMeta.refSearchFields;

  return {
    refFieldKey: config.fieldMeta.refFieldKey,
    many: config.fieldMeta.many,
    listKey: config.listKey,
    path: config.path,
    label: config.label,
    description: config.description,
    display:
      config.fieldMeta.displayMode === "count" ? "count" : "cards-or-select",
    refLabelField,
    refSearchFields,
    refListKey: config.fieldMeta.refListKey,
    graphqlSelection:
      config.fieldMeta.displayMode === "count"
        ? `${config.path}Count`
        : `${config.path} {
              id
              label: ${refLabelField}
            }`,
    hideCreate: config.fieldMeta.hideCreate,
    hideButtons: config.fieldMeta.hideButtons,
    defaultValue:
      cardsDisplayOptions !== undefined
        ? {
            kind: "cards-view",
            currentIds: new Set(),
            id: null,
            initialIds: new Set(),
            itemBeingCreated: false,
            itemsBeingEdited: new Set(),
            displayOptions: cardsDisplayOptions,
          }
        : config.fieldMeta.many
        ? {
            id: null,
            kind: "many",
            initialValue: [],
            value: [],
          }
        : { id: null, kind: "one", value: null, initialValue: null },
    deserialize: (data: any) => {
      if (config.fieldMeta.displayMode === "count") {
        return {
          id: data.id,
          kind: "count",
          count: data[`${config.path}Count`] ?? 0,
        };
      }
      if (cardsDisplayOptions !== undefined) {
        const initialIds = new Set<string>(
          (Array.isArray(data[config.path])
            ? data[config.path]
            : data[config.path]
            ? [data[config.path]]
            : []
          ).map((x: any) => x.id)
        );
        return {
          kind: "cards-view",
          id: data.id,
          itemsBeingEdited: new Set(),
          itemBeingCreated: false,
          initialIds,
          currentIds: initialIds,
          displayOptions: cardsDisplayOptions,
        };
      }
      if (config.fieldMeta.many) {
        let value = (data[config.path] || []).map((x: any) => ({
          id: x.id,
          label: x.label || x.id,
        }));
        return {
          kind: "many",
          id: data.id,
          initialValue: value,
          value,
        };
      }
      let value = data[config.path];
      if (value) {
        value = {
          id: value.id,
          label: value.label || value.id,
        };
      }
      return {
        kind: "one",
        id: data.id,
        value,
        initialValue: value,
      };
    },
    validate(value: any) {
      return (
        value.kind !== "cards-view" ||
        (value.itemsBeingEdited.size === 0 && !value.itemBeingCreated)
      );
    },
    serialize: (state: any) => {
      if (state.kind === "many") {
        const newAllIds = new Set(state.value.map((x: any) => x.id));
        const initialIds = new Set(state.initialValue.map((x: any) => x.id));
        let disconnect = state.initialValue
          .filter((x: any) => !newAllIds.has(x.id))
          .map((x: any) => ({ id: x.id }));
        let connect = state.value
          .filter((x: any) => !initialIds.has(x.id))
          .map((x: any) => ({ id: x.id }));
        if (disconnect.length || connect.length) {
          let output: Record<string, any> = {};

          if (disconnect.length) {
            output.disconnect = disconnect;
          }

          if (connect.length) {
            output.connect = connect;
          }

          return {
            [config.path]: output,
          };
        }
      } else if (state.kind === "one") {
        if (state.initialValue && !state.value) {
          return { [config.path]: { disconnect: true } };
        } else if (state.value && state.value.id !== state.initialValue?.id) {
          return {
            [config.path]: {
              connect: {
                id: state.value.id,
              },
            },
          };
        }
      } else if (state.kind === "cards-view") {
        const currentIdsSet = new Set(state.currentIds);
        const initialIdsSet = new Set(state.initialIds);
        let disconnect = [...state.initialIds]
          .filter((id: string) => !currentIdsSet.has(id))
          .map((id: string) => ({ id }));
        let connect = [...state.currentIds]
          .filter((id: string) => !initialIdsSet.has(id))
          .map((id: string) => ({ id }));

        if (config.fieldMeta.many) {
          if (disconnect.length || connect.length) {
            return {
              [config.path]: {
                connect: connect.length ? connect : undefined,
                disconnect: disconnect.length ? disconnect : undefined,
              },
            };
          }
        } else if (connect.length) {
          return {
            [config.path]: {
              connect: connect[0],
            },
          };
        } else if (disconnect.length) {
          return { [config.path]: { disconnect: true } };
        }
      }
      return {};
    },
    filter: {
      Filter: ({ value, onChange, type, autoFocus }: any) => {
        // Empty/not_empty filters don't need a UI component - they work without user input
        if (type === 'empty' || type === 'not_empty') return null
        
        // Simple controlled component - no client-side data fetching
        return (
          <ClientRelationshipFilter
            value={value}
            onChange={onChange}
            type={type}
            autoFocus={autoFocus}
            refListKey={config.fieldMeta.refListKey}
            refLabelField={refLabelField || 'name'}
            refSearchFields={refSearchFields || ['name']}
          />
        )
      },
      graphql: ({ type, value }: { type: string; value: string | string[] }) => {
        const many = config.fieldMeta.many || false
        if (type === 'empty' && !many) return { [config.path]: { equals: null } }
        if (type === 'empty' && many) return { [config.path]: { none: {} } }
        if (type === 'not_empty' && !many) return { [config.path]: { not: { equals: null } } }
        if (type === 'not_empty' && many) return { [config.path]: { some: {} } }
        if (type === 'is') return { [config.path]: { id: { equals: value } } }
        if (type === 'not_is') return { [config.path]: { not: { id: { equals: value } } } }
        if (type === 'some') return { [config.path]: { some: { id: { in: value } } } }
        if (type === 'not_some') return { [config.path]: { not: { some: { id: { in: value } } } } }
        return { [config.path]: { [type]: value } }
      },
      parseGraphQL: () => [],
      Label: ({ label, type, value }: { label: string; type: string; value: string | string[] }) => {
        if (type === 'empty' || type === 'not_empty') return label.toLowerCase()
        if (type === 'is' || type === 'not_is') return `${label.toLowerCase()} ${value}`
        if (Array.isArray(value)) {
          return `${label.toLowerCase()} (${value.length} selected)`
        }
        return `${label.toLowerCase()} ${value}`
      },
      types: {
        empty: { label: 'Is empty', initialValue: null },
        not_empty: { label: 'Is not empty', initialValue: null },
        ...(config.fieldMeta.many
          ? {
              some: { label: 'Is one of', initialValue: [] },
              not_some: { label: 'Is not one of', initialValue: [] },
            }
          : {
              is: { label: 'Is', initialValue: null },
              not_is: { label: 'Is not', initialValue: null },
            }),
      },
    },
  };
};

Cell.supportsLinkTo = true