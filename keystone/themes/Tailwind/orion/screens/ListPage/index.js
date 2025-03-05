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
import {
  ArrowUpDown,
  Circle,
  Search,
  Square,
  SquareArrowRight,
  Triangle,
  PlusCircleIcon,
  PlusIcon as PlusIcon2,
  ChevronDown,
  SearchIcon,
  Filter,
  ArrowRight,
  ChevronRight,
  Columns3,
  ListFilter,
  SlidersHorizontal,
  Plus,
  FilterIcon,
} from "lucide-react";

import { CreateButtonLink } from "../../components/CreateButtonLink";
import { DeleteManyButton } from "../../components/DeleteManyButton";
import { FieldSelection } from "../../components/FieldSelection";
import { FilterAdd } from "../../components/FilterAdd";
import { FilterList } from "../../components/FilterList";
import { ListTable } from "../../components/ListTable";
import { SortSelection } from "../../components/SortSelection";
import { Button } from "../../primitives/default/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  TableFooter,
} from "../../primitives/default/ui/table";

import { LoadingIcon } from "../../components/LoadingIcon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../primitives/default/ui/breadcrumb";
import {
  Pagination,
  PaginationDropdown,
  PaginationNavigation,
  PaginationStats,
} from "../../components/Pagination";
import { Input } from "../../primitives/default/ui/input";
import { Badge, BadgeButton } from "../../primitives/default/ui/badge";
import { AdminLink } from "../../components/AdminLink";
import { PageBreadcrumbs } from "../../components/PageBreadcrumbs";
import {
  CommandBar,
  CommandBarBar,
  CommandBarValue,
  CommandBarSeperator,
  CommandBarCommand,
} from "../../primitives/default/ui/command-bar";

const DiamondPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lucide lucide-diamond-plus"
  >
    <path d="M12 8v8" />
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z" />
    <path d="M8 12h8" />
  </svg>
);

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

const BaseToolbar = (props) => (
  <div className="-mb-4 md:-mb-6 shadow-md bottom-0 border border-b-0 flex flex-wrap justify-between p-3 rounded-t-xl sticky z-20 mt-8 bg-muted/40 gap-2">
    {props.children}
  </div>
);

export function ListPageTemplate({ listKey }) {
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
    loading,
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

  const sortIcons = {
    ASC: (
      <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">
        ASC
      </Badge>
    ),
    DESC: (
      <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">
        DESC
      </Badge>
    ),
  };
  return (
    <section
      aria-label={`${list.label} overview`}
      className="h-screen overflow-hidden flex flex-col"
    >
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
            showModelSwitcher: true,
            switcherType: "platform",
          },
          {
            type: "page",
            label: list.label,
          },
        ]}
      />

      {metaQuery.error ? (
        <div className="p-4">Error loading {list.label}...</div>
      ) : !metaQuery.data ? null : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search and Filters - Fixed Position */}
          <div className="flex flex-col gap-2.5 p-4 md:p-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                {list.label}
              </h1>
              <p className="text-muted-foreground">
                {list.description ? (
                  list.description
                ) : (
                  <span>
                    Create and manage{" "}
                    <span className="lowercase">{list.label}</span>
                  </span>
                )}
              </p>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Search */}
              <div className="relative flex-1 min-w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateSearch(searchString);
                  }}
                >
                  <Input
                    type="search"
                    className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm"
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

              {/* Right Side Controls */}
              <div className="flex items-center gap-2">
                <FilterAdd
                  listKey={listKey}
                  filterableFields={filterableFields}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                  >
                    <SlidersHorizontal className="stroke-muted-foreground" />
                    <span className="hidden lg:inline">Filter</span>
                  </Button>
                </FilterAdd>

                <SortSelection list={list} orderableFields={orderableFields}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                  >
                    <ArrowUpDown className="stroke-muted-foreground" />
                    <span className="hidden lg:inline">
                      {sort ? (
                        <>
                          {list.fields[sort.field].label}{" "}
                          <Badge
                            variant="blue"
                            className="ml-1 text-[10px] px-1 py-0 font-medium"
                          >
                            {sort.direction}
                          </Badge>
                        </>
                      ) : (
                        "Sort"
                      )}
                    </span>
                  </Button>
                </SortSelection>

                <FieldSelection
                  list={list}
                  fieldModesByFieldPath={listViewFieldModesByField}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                  >
                    <Columns3 className="stroke-muted-foreground" />
                    <span className="hidden lg:inline">Display</span>
                  </Button>
                </FieldSelection>

                {showCreate && (
                  <AdminLink href={`/${list.path}/create`}>
                    {/* <Button
                      size="icon"
                      className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                    >
                      <DiamondPlus className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        Create {list.singular}
                      </span>
                    </Button> */}
                    <Button className="w-9 lg:w-auto relative lg:ps-12 rounded-lg">
                      <span className="hidden lg:inline">
                        Create {list.singular}
                      </span>
                      <span className="bg-primary-foreground/15 pointer-events-none absolute inset-y-0 start-0 flex w-9 items-center justify-center">
                        <DiamondPlus
                          className="opacity-60"
                          size={16}
                          aria-hidden="true"
                        />
                      </span>
                    </Button>
                  </AdminLink>
                )}
              </div>
            </div>
          </div>

          <main className="flex-1 min-h-0 overflow-auto">
            {/* Active Filters */}
            {filters.filters.length > 0 && (
              <div className="flex gap-1.5 border-t bg-muted/40 py-2 px-6 items-center">
                <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
                  <FilterIcon
                    className="stroke-muted-foreground/50 size-4"
                    strokeWidth={1.5}
                  />
                </div>
                <FilterList filters={filters.filters} list={list} />
              </div>
            )}
            {!loading && !data ? null : loading ? (
              <div className="divide-y border-t">
                <div className="w-full bg-muted animate-pulse h-9" />
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="w-full bg-muted animate-pulse h-12"
                  />
                ))}
              </div>
            ) : data?.items?.length > 0 ? (
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
                refetch={refetch}
              />
            ) : (
              <div className="text-center flex flex-col items-center justify-center border-t bg-muted/40 p-10 h-full">
                <div className="relative h-11 w-11 mx-auto mb-2">
                  <Triangle className="absolute left-1 top-1 w-4 h-4 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950 rotate-[90deg]" />
                  <Square className="absolute right-[.2rem] top-1 w-4 h-4 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950 rotate-[30deg]" />
                  <Circle className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-900" />
                </div>
                <p className="mt-2 text-sm font-medium">
                  No <span className="lowercase">{list.label}</span>
                </p>
                {query.search || filters?.filters?.length ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Found matching your {searchParam ? "search" : "filters"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 mt-2"
                      onClick={() => {
                        updateSearchString("");
                        const path = window.location.pathname;
                        push(path);
                      }}
                    >
                      Clear filters & search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Get started by creating a new one.
                    </p>
                  </>
                )}
              </div>
            )}
          </main>
          {selectedItemsState.selectedItems.size > 0 ? (
            <CommandBar open={true} className="sticky bottom-0">
              <CommandBarBar>
                <CommandBarValue>
                  {selectedItemsState.selectedItems.size} selected
                </CommandBarValue>
                <CommandBarSeperator />
                <DeleteManyButton
                  list={list}
                  selectedItems={selectedItemsState.selectedItems}
                  refetch={refetch}
                >
                  {({ setIsOpen, isLoading, selectedCount }) => (
                    <CommandBarCommand
                      label="Delete"
                      action={() => setIsOpen(true)}
                      isLoading={isLoading}
                      shortcut={{ label: "d" }}
                    />
                  )}
                </DeleteManyButton>
                <CommandBarSeperator />
                <CommandBarCommand
                  label="Reset"
                  action={() => {
                    setSelectedItems({
                      itemsFromServer: selectedItemsState.itemsFromServer,
                      selectedItems: new Set(),
                    });
                  }}
                  shortcut={{ shortcut: "Escape", label: "esc" }}
                />
              </CommandBarBar>
            </CommandBar>
          ) : null}

          {/* Pagination with Command Bar */}
          {data?.items?.length > 0 && (
            <div className="sticky bottom-0 border-t py-2 px-4 mt-2">
              <div className="flex items-center justify-between gap-4">
                <PaginationStats
                  list={list}
                  total={data.count}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />

                {/* Command Bar */}

                <div className="flex items-center gap-2">
                  <PaginationNavigation
                    list={list}
                    total={data.count}
                    currentPage={currentPage}
                    pageSize={pageSize}
                  />
                  <PaginationDropdown
                    list={list}
                    total={data.count}
                    currentPage={currentPage}
                    pageSize={pageSize}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
