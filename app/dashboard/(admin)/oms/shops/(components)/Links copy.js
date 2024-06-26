"use client";
import React, { useMemo, useState } from "react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu-depracated";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useList } from "@keystone/keystoneProvider";
import { ListFilter, Plus, XIcon } from "lucide-react";
import { Button } from "@ui/button";
import { Badge, BadgeButton } from "@ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ui/select";
import { Label } from "@ui/label";
import { LinkIcon } from "@heroicons/react/16/solid";
import { useToasts } from "@keystone/screens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { cn } from "@keystone/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/popover";
import { Separator } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/separator";
const GET_CHANNELS = gql`
  query GetChannels($where: ChannelWhereInput, $take: Int, $skip: Int) {
    items: channels(where: $where, take: $take, skip: $skip) {
      id
      name
    }
    count: channelsCount(where: $where)
  }
`;

export const CreateLinkButton = ({ shopId, refetch }) => {
  const list = useList("Link");
  const { createWithData, state, error } = useCreateItem(list);
  const {
    data,
    loading,
    error: queryError,
  } = useQuery(GET_CHANNELS, {
    variables: { where: {}, take: 50, skip: 0 },
  });

  const handleCreateLink = async (channelId) => {
    const item = await createWithData({
      data: {
        shop: { connect: { id: shopId } },
        channel: { connect: { id: channelId } },
      },
    });
    if (item) {
      refetch();
      // refetch or update state if necessary
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <Button variant="secondary" className="p-0.5 flex items-center gap-3">
            <Plus className="size-3.5" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Select Channel to Link</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {loading && <DropdownMenuItem>Loading...</DropdownMenuItem>}
          {queryError && (
            <DropdownMenuItem>Error loading channels</DropdownMenuItem>
          )}
          {data?.items?.map((channel) => (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => handleCreateLink(channel.id)}
            >
              {channel.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Links = ({ shopId, links, refetch }) => {
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [editingFilter, setEditingFilter] = useState(null);

  const updateMutation = gql`
    mutation ($data: LinkUpdateInput!, $id: ID!) {
      item: updateLink(where: { id: $id }, data: $data) {
        id
      }
    }
  `;
  const [update] = useMutation(updateMutation, {
    errorPolicy: "all",
  });

  const toasts = useToasts();

  const list = useList("Order");

  const handleFilterSubmitInternal = (state, linkId, filtersArray) => {
    const { fieldPath, filterType, filterValue } = state;
    const updatedFiltersArray = filtersArray.filter(
      (f) => f.fieldPath !== fieldPath || f.filterType !== filterType
    );

    if (filterValue !== null) {
      updatedFiltersArray.push({ fieldPath, filterType, filterValue });
    }

    const transformFiltersToWhereInput = (list, filtersArray) => {
      const { fieldPath, filterType, filterValue } = filtersArray[0];
      const filterGraphQL = list.fields[fieldPath].controller.filter.graphql({
        type: filterType,
        value: filterValue,
      });
      return filterGraphQL;
    };

    const newFilter = transformFiltersToWhereInput(list, [
      { fieldPath, filterType, filterValue },
    ]);

    const combinedFilters = [...filtersArray, newFilter];

    update({
      variables: { data: { filters: combinedFilters }, id: linkId },
    })
      .then(({ errors }) => {
        if (errors?.length) {
          toasts.addToast({
            title: "Failed to update item",
            tone: "negative",
            message: errors[0].message,
          });
        } else {
          toasts.addToast({
            tone: "positive",
            title: "Saved successfully",
          });
          refetch();
          setEditingFilter(null);
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to update item",
          tone: "negative",
          message: err.message,
        });
      });
  };

  const handleFilterSubmit = (state) => {
    const selectedLink = links.find((link) => link.id === selectedLinkId);
    handleFilterSubmitInternal(state, selectedLinkId, selectedLink.filters);
  };

  const updateFilter = (linkId, field, type, value) => {
    console.log({ linkId, field, type, value });
    const link = links.find((link) => link.id === linkId);

    const updatedFiltersArray = link.filters.map((filter) => {
      const filterField = Object.keys(filter)[0];
      if (filterField === field) {
        // Update the filter type and value
        return {
          [filterField]: {
            mode: filter[filterField].mode,
            [type]: value,
          },
        };
      }
      return filter;
    });

    handleFilterSubmitInternal(
      { fieldPath: field, filterType: type, filterValue: value },
      linkId,
      updatedFiltersArray
    );
  };

  const deleteFilter = (linkId, field) => {
    console.log({ linkId, field });
    const link = links.find((link) => link.id === linkId);

    const updatedFiltersArray = link.filters.filter((filter) => {
      const filterField = Object.keys(filter)[0];
      return filterField !== field.path;
    });

    console.log({ updatedFiltersArray });
    update({
      variables: { data: { filters: updatedFiltersArray }, id: linkId },
    })
      .then(({ errors }) => {
        if (errors?.length) {
          toasts.addToast({
            title: "Failed to delete filter",
            tone: "negative",
            message: errors[0].message,
          });
        } else {
          toasts.addToast({
            tone: "positive",
            title: "Filter deleted successfully",
          });
          refetch();
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to delete filter",
          tone: "negative",
          message: err.message,
        });
      });
  };

  return (
    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <div
            key={link.id}
            className={cn(
              "bg-muted opacity-60 border rounded-lg flex justify-between p-2 cursor-pointer",
              selectedLinkId === link.id && "opacity-100"
            )}
            onClick={() => setSelectedLinkId(link.id)}
          >
            {link.channel.name}
            <Badge
              color="blue"
              className="ml-2 border rounded-md py-1 px-1.5 tracking-wide font-medium text-[.7rem]/3 flex gap-2 items-center"
            >
              {Object.keys(link.filters || {}).length} FILTERS
            </Badge>
          </div>
        ))}
        <CreateLinkButton shopId={shopId} refetch={refetch} />
      </div>

      {selectedLinkId && (
        <>
          <div className="p-3 bg-muted text-muted-foreground rounded-lg border flex flex-col gap-3">
            <div className="flex justify-between items-center">
              Filters
              <Badge
                color="blue"
                className="ml-2 border rounded-lg py-1 px-1 tracking-wide font-medium text-[.7rem]/3 flex gap-2 items-center cursor-pointer"
                onClick={() => setEditingFilter({ isNew: true })}
              >
                <Plus className="h-3 w-3 inline-block" />
              </Badge>
            </div>
            {links.find((link) => link.id === selectedLinkId).filters && (
              <div>
                <FilterList
                  filters={
                    links.find((link) => link.id === selectedLinkId).filters
                  }
                  list={list}
                  linkId={selectedLinkId}
                  updateFilter={updateFilter}
                  deleteFilter={deleteFilter}
                  setEditingFilter={setEditingFilter}
                />
              </div>
            )}
          </div>

          {editingFilter && (
            <FilterAddContent
              filters={links.find((link) => link.id === selectedLinkId).filters}
              linkId={selectedLinkId}
              refetch={refetch}
              list={list}
              listKey="Order"
              editingFilter={editingFilter}
              setEditingFilter={setEditingFilter}
              handleFilterSubmit={handleFilterSubmit}
            />
          )}
        </>
      )}
    </div>
  );
};

let listMetaGraphqlQuery = gql`
  query ($listKey: String!) {
    keystone {
      adminMeta {
        list(key: $listKey) {
          hideDelete
          hideCreate
          fields {
            path
            isOrderable
            isFilterable
            listView {
              fieldMode
            }
          }
        }
      }
    }
  }
`;

const filterLabels = {
  equals: "equals",
  not: "does not equal",
  in: "in",
  notIn: "not in",
  contains: "contain",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  is: "is",
  not_matches: "does not match",
  matches: "matches",
  some: "some",
  none: "none",
  every: "every",
};

const transformWhereInputToReadable = (filters, list) => {
  return filters.map((filter) => {
    const fieldPath = Object.keys(filter)[0];
    const fieldFilter = filter[fieldPath];
    const field = list.fields[fieldPath];
    let label = `${field.label} `;

    if (fieldFilter.not) {
      const innerFilterType = Object.keys(fieldFilter.not)[0];
      label += `does not ${filterLabels[innerFilterType]} ${fieldFilter.not[innerFilterType]}`;
    } else {
      const filterType = Object.keys(fieldFilter).find((key) => key !== "mode");
      label += `${filterLabels[filterType]} ${fieldFilter[filterType]}`;
    }

    return label;
  });
};

export function FilterList({
  filters,
  list,
  linkId,
  updateFilter,
  deleteFilter,
  setEditingFilter,
}) {
  const readableFilters = transformWhereInputToReadable(filters, list);

  return (
    <div className="flex flex-col gap-2">
      {filters.map((filter, index) => {
        const fieldPath = Object.keys(filter)[0];
        const fieldMeta = list.fields[fieldPath];
        return (
          <FilterPill
            key={index}
            field={fieldMeta}
            readableFilter={readableFilters[index]}
            linkId={linkId}
            deleteFilter={deleteFilter}
            setEditingFilter={setEditingFilter}
          />
        );
      })}
    </div>
  );
}

function FilterPill({
  readableFilter,
  field,
  linkId,
  deleteFilter,
  setEditingFilter,
}) {
  const onRemove = () => {
    deleteFilter(linkId, field);
  };

  const handleEdit = () => {
    setEditingFilter({
      fieldPath: field.path,
      filterType: readableFilter.filterType,
      filterValue: readableFilter.filterValue,
    });
  };

  return (
    <div className="rounded-md inline-flex shadow-XS" role="group">
      <button
        type="button"
        onClick={handleEdit}
        className="text-nowrap px-3 py-[3px] text-xs font-medium text-zinc-500 bg-white border border-zinc-200 border-r-0 rounded-s-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
      >
        {readableFilter}
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="px-1 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-e-md hover:bg-zinc-200 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-zinc-900 dark:border-zinc-600 dark:text-white dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
      >
        <XIcon size={14} className="stroke-muted-foreground" />
      </button>
    </div>
  );
}

function FilterAddContent({
  list,
  listKey,
  filters = {},
  linkId,
  refetch,
  editingFilter,
  setEditingFilter,
  handleFilterSubmit,
}) {
  const [state, setState] = useState(() => {
    if (editingFilter.isNew) {
      return { fieldPath: null, filterType: null, filterValue: null };
    } else {
      return {
        fieldPath: editingFilter.fieldPath,
        filterType: editingFilter.filterType,
        filterValue: editingFilter.filterValue,
      };
    }
  });
  
  const metaQuery = useQuery(listMetaGraphqlQuery, { variables: { listKey } });

  const { listViewFieldModesByField, filterableFields, orderableFields } = useMemo(() => {
    const listViewFieldModesByField = {};
    const orderableFields = new Set();
    const filterableFields = new Set();
    for (const field of metaQuery.data?.keystone.adminMeta.list?.fields || []) {
      listViewFieldModesByField[field.path] = field.listView.fieldMode;
      if (field.isOrderable) {
        orderableFields.add(field.path);
      }
      if (field.isFilterable) {
        filterableFields.add(field.path);
      }
    }
    return { listViewFieldModesByField, orderableFields, filterableFields };
  }, [metaQuery.data?.keystone.adminMeta.list?.fields]);

  const fieldsWithFilters = useMemo(() => {
    const fieldsWithFilters = {};
    Object.keys(list.fields).forEach((fieldPath) => {
      const field = list.fields[fieldPath];
      if (filterableFields.has(fieldPath) && field.controller.filter) {
        fieldsWithFilters[fieldPath] = field;
      }
    });
    return fieldsWithFilters;
  }, [list.fields, filterableFields]);

  const allFilterableFields = useMemo(() => {
    const allFilterableFields = {};
    Object.keys(fieldsWithFilters).forEach((fieldPath) => {
      const field = fieldsWithFilters[fieldPath];
      const filters = {};
      Object.keys(field.controller.filter.types).forEach((filterType) => {
        filters[filterType] = filterLabels[filterType] || field.controller.filter.types[filterType].label;
      });
      allFilterableFields[fieldPath] = filters;
    });
    return allFilterableFields;
  }, [fieldsWithFilters]);

  const filtersByFieldThenType = useMemo(() => {
    const filtersByFieldThenType = {};
    Object.keys(fieldsWithFilters).forEach((fieldPath) => {
      const field = fieldsWithFilters[fieldPath];
      let hasUnusedFilters = false;
      const filters = {};
      Object.keys(field.controller.filter.types).forEach((filterType) => {
        if (filters[`!${fieldPath}_${filterType}`] === undefined) {
          hasUnusedFilters = true;
          filters[filterType] = filterLabels[filterType] || field.controller.filter.types[filterType].label;
        }
      });
      if (hasUnusedFilters) {
        filtersByFieldThenType[fieldPath] = filters;
      }
    });
    return filtersByFieldThenType;
  }, [fieldsWithFilters]);

  const handleSelectFieldPath = (fieldPath) => {
    setState({
      fieldPath,
      filterType: null,
      filterValue: null,
    });
  };

  const handleSelectFilterType = (filterType) => {
    setState((prevState) => ({
      ...prevState,
      filterType,
      filterValue:
        prevState.filterValue ||
        (fieldsWithFilters[prevState.fieldPath]?.controller.filter.types[
          filterType
        ]?.initialValue ??
          null),
    }));
  };

  return (
    <div className="h-full p-3 bg-background rounded-lg border">
      <div className="space-y-2">
        <div className="space-y-1">
          <Label>Where</Label>
          <Select value={state.fieldPath} onValueChange={handleSelectFieldPath}>
            <SelectTrigger className="text-base w-full bg-muted/40 shadow-sm">
              <SelectValue placeholder="Select a field">
                {state.fieldPath
                  ? list.fields[state.fieldPath]?.label ?? "Unknown field"
                  : "Select a field"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(allFilterableFields).map((fieldPath) => (
                <SelectItem key={fieldPath} value={fieldPath}>
                  {list.fields[fieldPath]?.label ?? fieldPath}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Condition</Label>
          <Select
            value={state.filterType || ""}
            onValueChange={handleSelectFilterType}
            disabled={!state.fieldPath}
          >
            <SelectTrigger className="text-base w-full bg-muted/40 shadow-sm">
              <SelectValue placeholder="Select a condition">
                {state.filterType && state.fieldPath && filtersByFieldThenType[state.fieldPath]
                  ? filtersByFieldThenType[state.fieldPath][state.filterType] ??
                    "Unknown condition"
                  : "Condition"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {state.fieldPath &&
                filtersByFieldThenType[state.fieldPath] &&
                Object.entries(filtersByFieldThenType[state.fieldPath]).map(
                  ([filterType, label]) => (
                    <SelectItem key={filterType} value={filterType}>
                      {label}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
        </div>
        {state.fieldPath &&
          state.filterType &&
          fieldsWithFilters[state.fieldPath] &&
          (() => {
            const { Filter } =
              fieldsWithFilters[state.fieldPath].controller.filter;
            if (Filter)
              return (
                <div className="text-base space-y-1">
                  <Label>Value</Label>
                  <Filter
                    type={state.filterType}
                    value={state.filterValue}
                    placeholder="Enter value"
                    onChange={(value) => {
                      setState((state) => ({
                        ...state,
                        filterValue: value,
                      }));
                    }}
                  />
                </div>
              );
          })()}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setEditingFilter(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleFilterSubmit(state)}
            disabled={
              !state.fieldPath ||
              !state.filterType ||
              state.filterValue === undefined
            }
          >
            {editingFilter.isNew ? "Add" : "Update"} Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

