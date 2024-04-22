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
import { ListTable } from "@keystone/components/ListTable";
import { SortSelection } from "@keystone/components/SortSelection";
import { Input } from "@keystone/primitives/default/ui/input";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  ArrowUpDown,
  ChevronRight,
  Circle,
  Columns3,
  PlusIcon,
  Search,
  Square,
  SquareArrowRight,
  Triangle,
} from "lucide-react";

import { LoadingIcon } from "@keystone/components/LoadingIcon";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@keystone/primitives/default/ui/breadcrumb";
import { Pagination } from "../../components/Pagination";

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
        <div className="w-4xl max-w-full">
          <main className="items-start gap-2 sm:py-0 md:gap-4">
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>{list.label}</BreadcrumbItem>
                {/* {list.isSingleton ? (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/dashboard/${list.path}`}>{list.label}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/dashboard/${list.path}`}>{list.label}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )} */}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex mt-2 mb-4">
              <div className="flex-col items-center">
                <h1 className="text-lg font-semibold md:text-2xl">
                  {list.label}
                </h1>
                <p className="text-muted-foreground">
                  {list.description ? (
                    <p>{list.description}</p>
                  ) : (
                    <span>
                      Create and manage{" "}
                      <span className="lowercase">{list.label}</span>
                    </span>
                  )}
                </p>
              </div>
              {data.count || query.search || filters.filters.length ? (
                <div className="ml-auto">
                  {showCreate && <CreateButtonLink list={list} />}
                </div>
              ) : null}
            </div>
            <div class="no-scrollbar overflow-x-auto border rounded-lg divide-y">
              <div class="flex gap-3 py-3 px-3">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateSearch(searchString);
                    }}
                  >
                    <Input
                      type="search"
                      className="w-full rounded-md bg-muted/40 pl-10"
                      value={searchString}
                      onChange={(e) => updateSearchString(e.target.value)}
                      placeholder={`Search by ${
                        searchLabels.length
                          ? searchLabels.join(", ").toLowerCase()
                          : "ID"
                      }`}
                    />
                  </form>
                </div>
              </div>

              <div className="flex gap-2 items-center bg-slate-300/20 dark:bg-muted/10 px-3 py-2">
                <SortSelection
                  list={list}
                  orderableFields={orderableFields}
                  dropdownTrigger={
                    <button
                      type="button"
                      className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-gray-600 bg-white dark:bg-slate-800 rounded-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    >
                      <ArrowUpDown
                        size={12}
                        className="stroke-muted-foreground"
                      />
                      SORT
                    </button>
                  }
                />
                <FieldSelection
                  list={list}
                  fieldModesByFieldPath={listViewFieldModesByField}
                  rightSection={
                    <Button
                      variant="plain"
                      size="xs"
                      onClick={resetToDefaults}
                      className="opacity-85 text-red-800"
                      isDisabled={
                        !Boolean(
                          filters.filters.length ||
                            query.sortBy ||
                            query.fields ||
                            query.search
                        )
                      }
                    >
                      Reset
                    </Button>
                  }
                  dropdownTrigger={
                    <button
                      type="button"
                      className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-gray-600 bg-white dark:bg-slate-800 rounded-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    >
                      <Columns3 size={12} className="stroke-muted-foreground" />
                      COLUMNS
                    </button>
                  }
                />
                {data.count || filters.filters.length ? (
                  <FilterAdd
                    listKey={listKey}
                    filterableFields={filterableFields}
                    dropdownTrigger={
                      <button
                        type="button"
                        className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-gray-600 bg-white dark:bg-slate-800 rounded-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:text-slate-300 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                      >
                        <PlusIcon
                          size={13}
                          className="stroke-muted-foreground"
                        />
                        FILTER
                      </button>
                    }
                  />
                ) : null}
                {filters.filters.length ? (
                  <>
                    <SquareArrowRight className="w-4 h-4 -mr-1 stroke-muted-foreground/60" />
                    <FilterList filters={filters.filters} list={list} />
                  </>
                ) : null}
              </div>
              {selectedItemsState.selectedItems.size > 0 && (
                <div className="py-2 pr-2 pl-3 border fixed bottom-4 z-50 shadow-lg rounded-lg bg-white dark:bg-slate-800">
                  <div className="flex gap-4 items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {selectedItemsState.selectedItems.size} of{" "}
                      {data.items.length} {list.label} selected
                    </span>
                    {!(
                      metaQuery.data?.keystone.adminMeta.list?.hideDelete ??
                      true
                    ) && (
                      <DeleteManyButton
                        list={list}
                        selectedItems={selectedItemsState.selectedItems}
                        refetch={refetch}
                      />
                    )}
                  </div>
                </div>
              )}
              <Pagination
                list={list}
                total={data.count}
                currentPage={currentPage}
                pageSize={pageSize}
              />
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
                <div>
                  <div className="flex flex-col items-center p-10 border-dashed border-2 rounded-lg m-5">
                    <div className="flex opacity-40">
                      <Triangle className="w-8 h-8 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950" />
                      <Circle className="w-8 h-8 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
                      <Square className="w-8 h-8 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950" />
                    </div>
                    {query.search || filters.filters.length ? (
                      <>
                        <span className="pt-4 font-semibold">
                          No <span className="lowercase"> {list.label} </span>{" "}
                        </span>
                        <span className="text-muted-foreground pb-4">
                          Found{" "}
                          {searchParam
                            ? `matching your search`
                            : `matching your filters`}{" "}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            updateSearchString("");
                            const { search, ...queries } = query;
                            const newQueryString = new URLSearchParams(
                              queries
                            ).toString();
                            push(`?${newQueryString}`);
                          }}
                        >
                          Clear filters &amp; search
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="pt-4 font-semibold">
                          No <span className="lowercase"> {list.label} </span>
                        </span>
                        <span className="text-muted-foreground pb-4">
                          Get started by creating a new one.{" "}
                        </span>
                        {showCreate && <CreateButtonLink list={list} />}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </>
  );
};
