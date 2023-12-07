import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";

import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";

import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useQueryParamsFromLocalStorage } from "@keystone/utils/useQueryParamsFromLocalStorage";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";

import { CreateButtonLink } from "@keystone/components/CreateButtonLink";
import { DeleteManyButton } from "@keystone/components/DeleteManyButton";
import { FieldSelection } from "@keystone/components/FieldSelection";
import { FilterAdd } from "@keystone/components/FilterAdd";
import { FilterList } from "@keystone/components/FilterList";
import { ListPageHeader } from "@keystone/components/ListPageHeader";
import { ListTable } from "@keystone/components/ListTable";
import { ResultsSummaryContainer } from "@keystone/components/ResultsSummaryContainer";
import { SortSelection } from "@keystone/components/SortSelection";
import { PaginationLabel } from "@keystone/components/Pagination";
import { Input } from "@keystone/primitives/default/ui/input";
import { Button } from "@keystone/primitives/default/ui/button";
import { Ban, SlashIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/primitives/default/ui/tooltip";
import { Card } from "@keystone/primitives/default/ui/card";
import { LoadingIcon } from "@keystone/components/LoadingIcon";
import Link from "next/link";

const HEADER_HEIGHT = 80;

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

export const storeableQueries = ["sortBy", "fields"];

export const ListPage = ({ params }) => {
  const listKey = params.listKey;
  const listsObject = {};
  for (const [key, list] of Object.entries(models)) {
    const { adminUILabels } = getNamesFromList(key, list);
    listsObject[adminUILabels.path] = key;
  }
  const key = listsObject[listKey];

  return <ListPageTemplate listKey={key} />;
};

export const ListPageTemplate = ({ listKey }) => {
  const list = useList(listKey);

  const { push } = useRouter();
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const { resetToDefaults } = useQueryParamsFromLocalStorage(listKey);

  const currentPage =
    typeof query.page === "string" && !Number.isNaN(parseInt(query.page))
      ? Number(query.page)
      : 1;
  const pageSize =
    typeof query.pageSize === "string" &&
    !Number.isNaN(parseInt(query.pageSize))
      ? parseInt(query.pageSize)
      : list.pageSize;

  const metaQuery = useQuery(listMetaGraphqlQuery, { variables: { listKey } });

  let { listViewFieldModesByField, filterableFields, orderableFields } =
    useMemo(() => {
      const listViewFieldModesByField = {};
      const orderableFields = new Set();
      const filterableFields = new Set();
      for (const field of metaQuery.data?.keystone.adminMeta.list?.fields ||
        []) {
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

  const sort = useSort(list, orderableFields);
  const filters = useFilters(list, filterableFields);

  const searchFields = Object.keys(list.fields).filter(
    (key) => list.fields[key].search
  );
  const searchLabels = searchFields.map((key) => list.fields[key].label);

  const searchParam = typeof query.search === "string" ? query.search : "";
  const [searchString, updateSearchString] = useState(searchParam);
  const search = useFilter(searchParam, list, searchFields);

  const updateSearch = (value) => {
    // Extract search and the rest of the queries from the current URL
    const { search, ...queries } = query;

    // Construct the new query string
    const newQueryString = new URLSearchParams(queries).toString();

    if (value.trim()) {
      // If there is a value, add it to the query string
      const searchQuery = `search=${encodeURIComponent(value)}`;
      const queryString = newQueryString
        ? `${newQueryString}&${searchQuery}`
        : searchQuery;
      push(`?${queryString}`);
    } else {
      // If there is no value, just push the queries without 'search'
      push(`?${newQueryString}`);
    }
  };

  let selectedFields = useSelectedFields(list, listViewFieldModesByField);

  let {
    data: newData,
    error: newError,
    refetch,
  } = useQuery(
    useMemo(() => {
      let selectedGqlFields = [...selectedFields]
        .map((fieldPath) => {
          return list.fields[fieldPath].controller.graphqlSelection;
        })
        .join("\n");
      return gql`
    query ($where: ${
      list.gqlNames.whereInputName
    }, $take: Int!, $skip: Int!, $orderBy: [${list.gqlNames.listOrderName}!]) {
      items: ${
        list.gqlNames.listQueryName
      }(where: $where,take: $take, skip: $skip, orderBy: $orderBy) {
        ${
          // TODO: maybe namespace all the fields instead of doing this
          selectedFields.has("id") ? "" : "id"
        }
        ${selectedGqlFields}
      }
      count: ${list.gqlNames.listQueryCountName}(where: $where)
    }
  `;
    }, [list, selectedFields]),
    {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      skip: !metaQuery.data,
      variables: {
        where: { ...filters.where, ...search },
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
        orderBy: sort
          ? [{ [sort.field]: sort.direction.toLowerCase() }]
          : undefined,
      },
    }
  );

  let [dataState, setDataState] = useState({ data: newData, error: newError });

  if (newData && dataState.data !== newData) {
    setDataState({ data: newData, error: newError });
  }

  const { data, error } = dataState;

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  const [selectedItemsState, setSelectedItems] = useState(() => ({
    itemsFromServer: undefined,
    selectedItems: new Set(),
  }));

  // this removes the selected items which no longer exist when the data changes
  // because someone goes to another page, changes filters or etc.
  if (data && data.items && selectedItemsState.itemsFromServer !== data.items) {
    const newSelectedItems = new Set();
    data.items.forEach((item) => {
      if (selectedItemsState.selectedItems.has(item.id)) {
        newSelectedItems.add(item.id);
      }
    });
    setSelectedItems({
      itemsFromServer: data.items,
      selectedItems: newSelectedItems,
    });
  }

  const showCreate =
    !(metaQuery.data?.keystone.adminMeta.list?.hideCreate ?? true) || null;

  return (
    <>
      {metaQuery.error ? (
        // TODO: Show errors nicely and with information
        "Error..."
      ) : data && metaQuery.data ? (
        <div className="max-w-4xl">
          <div className="flex">
            <nav className="pb-2 rounded-lg" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center text-md font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                  >
                    <svg
                      className="w-3 h-3 mr-2.5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                    </svg>
                    Home
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="w-3 h-3 mx-1 text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 6 10"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2"
                        d="m1 9 4-4-4-4"
                      />
                    </svg>
                    <div className="ml-1 text-md font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                      {list.label}
                    </div>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <div className="flex items-center justify-between pt-8 pb-4">
            <div className="grid gap-1">
              <h1 className="font-bold text-3xl md:text-4xl">{list.label}</h1>
              <p className="text-lg text-muted-foreground">
                Create and manage {list.label}
              </p>
            </div>
            {showCreate && <CreateButtonLink list={list} />}
          </div>
          {list.description !== null && <p>{list.description}</p>}

          <div className="w-full flex flex-1 items-center">
            <div className="flex-1 space-x-4 items-center mr-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateSearch(searchString);
                }}
              >
                <Input
                  value={searchString}
                  onChange={(e) => updateSearchString(e.target.value)}
                  placeholder={`Search by ${
                    searchLabels.length ? searchLabels.join(", ") : "ID"
                  }`}
                  className="max-w-sm"
                />
              </form>
            </div>
            <div className="ml-auto flex space-x-4 items-center">
              <SortSelection list={list} orderableFields={orderableFields} />
              <FieldSelection
                list={list}
                fieldModesByFieldPath={listViewFieldModesByField}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="border-dashed"
                      size="icon"
                      variant="outline"
                      onClick={resetToDefaults}
                      isDisabled={
                        !Boolean(
                          filters.filters.length ||
                            query.sortBy ||
                            query.fields ||
                            query.search
                        )
                      }
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset columns to default</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex mt-4 mb-2 gap-3">
            {data.count || filters.filters.length ? (
              <FilterAdd
                listKey={listKey}
                filterableFields={filterableFields}
              />
            ) : null}
            {filters.filters.length ? (
              <FilterList filters={filters.filters} list={list} />
            ) : null}
          </div>
          {selectedItemsState.selectedItems.size > 0 && (
            <div className="flex gap-6 items-center bg-muted/50 border mb-2 px-4 py-2 rounded-md">
              <span className="text-sm text-muted-foreground font-medium">
                {selectedItemsState.selectedItems.size} of {data.items.length}{" "}
                {list.label} selected
              </span>
              {!(
                metaQuery.data?.keystone.adminMeta.list?.hideDelete ?? true
              ) && (
                <DeleteManyButton
                  list={list}
                  selectedItems={selectedItemsState.selectedItems}
                  refetch={refetch}
                />
              )}
            </div>
          )}
          {data.count ? (
            <ListTable
              count={data.count}
              currentPage={currentPage}
              itemsGetter={dataGetter.get("items")}
              listKey={listKey}
              pageSize={pageSize}
              selectedFields={selectedFields}
              sort={sort}
              selectedItems={selectedItemsState.selectedItems}
              onSelectedItemsChange={(selectedItems) => {
                setSelectedItems({
                  itemsFromServer: selectedItemsState.itemsFromServer,
                  selectedItems,
                });
              }}
              orderableFields={orderableFields}
            />
          ) : (
            <Card className="text-lg bg-muted shadow-inner border-dashed flex justify-center py-[100px] mt-6 text-foreground/60 font-medium">
              {list.plural} will appear here
            </Card>
          )}
        </div>
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </>
  );
};
