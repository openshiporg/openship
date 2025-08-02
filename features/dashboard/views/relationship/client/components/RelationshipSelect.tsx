import React, { useState, useEffect, useCallback } from "react";
import { getRelationshipOptions } from "@/features/dashboard/actions/relationship";
import { Select, MultiSelect } from "./Select";
import type { Option } from "./Select";
import useSWR from "swr";
import { validate as validateUUID } from "uuid";

interface RelationshipSelectProps {
  list: {
    key: string;
    labelField: string;
    graphql?: {
      names: {
        whereInputName: string;
        listQueryName: string;
        listQueryCountName: string;
      };
    };
  };
  labelField: string;
  isDisabled?: boolean;
  autoFocus?: boolean;
  state: {
    kind: "many" | "one";
    value: any[] | any;
    onChange: (value: any) => void;
  };
  "aria-describedby"?: string;
  extraSelection?: string;
  searchFields?: string[];
  placeholder?: string;
  controlShouldRenderValue?: boolean;
}

// ID validators for different ID field types
const idValidators: Record<string, (value: string) => boolean> = {
  uuid: validateUUID as (value: string) => boolean,
  cuid(value: string) {
    return value.startsWith("c");
  },
  autoincrement(value: string) {
    return /^\d+$/.test(value);
  },
};

// Create filter conditions based on search input
function createFilterConditions(search: string, list: any, searchFields: string[]) {
  if (!search.length || !list) return { OR: [] };

  const idFieldKind = list.fields?.id?.controller?.idFieldKind;
  const trimmedSearch = search.trim();
  const isValidId = idFieldKind && idValidators[idFieldKind]?.(trimmedSearch);

  const conditions = [];
  if (isValidId) {
    conditions.push({ id: { equals: trimmedSearch } });
  }

  for (const fieldKey of searchFields) {
    const field = list.fields?.[fieldKey];
    if (field) {
      conditions.push({
        [field.path]: {
          contains: trimmedSearch,
          mode: field.search === "insensitive" ? "insensitive" : undefined,
        },
      });
    }
  }

  return { OR: conditions };
}

export function RelationshipSelect({
  list,
  labelField,
  isDisabled = false,
  autoFocus = false,
  state,
  "aria-describedby": ariaDescribedby,
  extraSelection = "",
  searchFields = [],
  placeholder = "Search...",
  controlShouldRenderValue = true,
}: RelationshipSelectProps) {
  // Search state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [accumulatedOptions, setAccumulatedOptions] = useState<Option[]>([]);
  const PAGE_SIZE = 10;

  // The list already has the GraphQL names from getAdminMetaAction
  const listData = list;

  // Create where clause from search
  const where = createFilterConditions(search, listData, searchFields);

  // Reset accumulated options when search changes
  useEffect(() => {
    setAccumulatedOptions([]);
    setPage(0);
  }, [search]);

  // Fetch options using the list query with search filtering
  const { data: optionsData, isLoading: optionsLoading, error } = useSWR(
    listData && listData.graphql?.names
      ? ["relationshipOptions", list.key, labelField, search, page]
      : null,
    async () => {
      if (!listData || !listData.graphql?.names) {
        throw new Error("List data or graphql names not available");
      }

      const result = await getRelationshipOptions(
        list.key,
        where,
        PAGE_SIZE,
        page * PAGE_SIZE,
        labelField,
        extraSelection,
        {
          whereInputName: listData.graphql.names.whereInputName,
          listQueryName: listData.graphql.names.listQueryName,
          listQueryCountName: listData.graphql.names.listQueryCountName,
        }
      );

      if (result.success) {
        const responseData = result.success && 'data' in result ? (result.data ?? { items: [], count: 0 }) : { items: [], count: 0 };
        const newOptions = (responseData.items ?? []).map((item: any) => ({
          value: item.id,
          label: item[labelField],
          data: item,
        }));

        // Only accumulate options if this is a "load more" request
        if (page > 0) {
          setAccumulatedOptions((prev) => [...prev, ...newOptions]);
        }

        return {
          items: newOptions,
          count: responseData.count ?? 0,
        };
      } else {
        console.error("Error fetching relationship options (useSWR):", result.error);
        // Return empty data on error
        return { items: [], count: 0 };
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 200,
    }
  );

  const isLoading = optionsLoading;
  const currentOptions =
    page === 0 ? optionsData?.items ?? [] : accumulatedOptions; // Use nullish coalescing


  const handleSearch = useCallback(async (searchValue: string): Promise<Option[]> => {
    setSearch(searchValue);
    setPage(0);
    setAccumulatedOptions([]);

    // Wait for SWR to fetch the data
    if (!listData || !listData.graphql?.names) {
      return [];
    }

    // Use the server action instead of fetchGraphQL
    const result = await getRelationshipOptions(
      list.key,
      createFilterConditions(searchValue, listData, searchFields),
      PAGE_SIZE,
      0,
      labelField,
      extraSelection,
      {
        whereInputName: listData.graphql.names.whereInputName,
        listQueryName: listData.graphql.names.listQueryName,
        listQueryCountName: listData.graphql.names.listQueryCountName,
      }
    );

    if (result.success) {
      // Map items safely, providing default empty array
      return (result.success && 'data' in result ? (result.data?.items ?? []) : []).map((item: any) => ({
        value: item.id,
        label: item[labelField],
        data: item,
      }));
    } else {
      console.error("Error fetching relationship options (handleSearch):", result.error);
      return []; // Return empty array on error
    }
  }, [listData, labelField, extraSelection, searchFields, PAGE_SIZE]);


  if (state.kind === "many") {
    return (
      <div>
        <MultiSelect
          value={state.value?.map((item: any) => ({
            value: item.id,
            label: item.label || item[labelField],
            data: item,
          })) || []}
          onChange={(value) => {
            state.onChange(
              value.map((x) => ({ id: x.value, label: x.label, data: x.data }))
            );
          }}
          onInputChange={handleSearch}
          isDisabled={isDisabled}
          autoFocus={autoFocus}
          isLoading={isLoading}
          options={currentOptions}
          aria-describedby={ariaDescribedby}
          placeholder={placeholder}
          controlShouldRenderValue={controlShouldRenderValue}
        />
      </div>
    );
  }

  return (
    <div>
      <Select
        value={
          state.value
            ? {
                value: state.value.id,
                label: state.value.label || state.value[labelField],
                data: state.value,
              }
            : null
        }
        onChange={(value) => {
          // Make sure we're passing the correct format to state.onChange
          // This is critical for the form system to work correctly
          state.onChange(
            value
              ? {
                  id: value.value,
                  label: value.label,
                  data: value.data,
                }
              : null
          );
        }}
        onInputChange={handleSearch}
        isDisabled={isDisabled}
        autoFocus={autoFocus}
        isLoading={isLoading}
        options={currentOptions}
        aria-describedby={ariaDescribedby}
        placeholder={placeholder}
        controlShouldRenderValue={controlShouldRenderValue}
      />
    </div>
  );
}
