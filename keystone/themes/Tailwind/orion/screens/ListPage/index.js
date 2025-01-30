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
const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
    id: "1",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
    id: "2",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
    id: "3",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
    id: "4",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
    id: "5",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
    id: "6",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
    id: "7",
    createdAt: "2021-01-01",
    updatedAt: "2021-01-01",
  },
];

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
    <div className="h-screen overflow-hidden">
      {metaQuery.error ? (
        "Error..."
      ) : data && metaQuery.data ? (
        <>
          <PageBreadcrumbs
            items={[
              {
                type: "link",
                label: "Dashboard",
                href: "/",
              },
              {
                type: "model",
                label: list.label,
                href: `/${list.path}`,
                showModelSwitcher: true,
              },
            ]}
          />
          <main className="w-full h-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2.5">
              {/* Simple Title */}
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">{list.label}</h1>
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
              {/* Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                {/* Left Side Controls */}
                <div className="relative flex-1 min-w-72">
                  <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <FilterAdd
                  listKey={listKey}
                  filterableFields={filterableFields}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                  >
                    <FilterIcon className="stroke-muted-foreground" />
                    <span className="hidden lg:inline">Filter</span>
                  </Button>
                </FilterAdd>

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
                    <Button
                      size="icon"
                      className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                    >
                      <DiamondPlus className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        Create {list.singular}
                      </span>
                    </Button>
                  </AdminLink>
                )}
              </div>

              {/* Active Filters */}
              {filters.filters.length > 0 && (
                <div className="flex gap-1.5 mt-1 border bg-muted/40 rounded-lg p-2 items-center">
                  <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
                    <FilterIcon className="stroke-muted-foreground/50 size-4" strokeWidth={1.5} />
                  </div>
                  <FilterList filters={filters.filters} list={list} />
                </div>
              )}
              <div>
                <SortSelection list={list} orderableFields={orderableFields}>
                  <Button
                    variant="link"
                    size="xs"
                    className="uppercase py-1 px-0 text-xs text-muted-foreground [&_svg]:size-3"
                  >
                    Sorting by{" "}
                    {sort ? (
                      <>
                        {list.fields[sort.field].label}
                        {sortIcons[sort.direction]}
                      </>
                    ) : (
                      <>default</>
                    )}
                    <ChevronDown />
                  </Button>
                </SortSelection>
              </div>
            </div>

            {/* Table Section */}
            {data.count ? (
              <>
                <div className="flex flex-col flex-1 min-h-0 mb-8">
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
                </div>
                <BaseToolbar>
                  {selectedItemsState.selectedItems.size > 0 ? (
                    <div className="w-full flex flex-wrap gap-4 items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        <strong>{selectedItemsState.selectedItems.size}</strong>{" "}
                        of <strong>{data.items.length}</strong> {list.label}{" "}
                        selected
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
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <PaginationStats
                          list={list}
                          total={data.count}
                          currentPage={currentPage}
                          pageSize={pageSize}
                        />
                      </div>
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
                    </>
                  )}
                </BaseToolbar>
              </>
            ) : (
              <div className="flex flex-col items-center p-10 border rounded-lg">
                <div className="flex opacity-40">
                  <Triangle className="w-8 h-8 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950" />
                  <Circle className="w-8 h-8 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
                  <Square className="w-8 h-8 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950" />
                </div>
                {query.search || filters.filters.length ? (
                  <>
                    <span className="pt-4 font-semibold">
                      No <span className="lowercase">{list.label}</span>{" "}
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
                        const path = window.location.pathname;
                        push(path);
                      }}
                    >
                      Clear filters &amp; search
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="pt-4 font-semibold">
                      No <span className="lowercase">{list.label}</span>
                    </span>
                    <span className="text-muted-foreground pb-4">
                      Get started by creating a new one.{" "}
                    </span>
                    {showCreate && <CreateButtonLink list={list} />}
                  </>
                )}
              </div>
            )}
          </main>
        </>
      ) : null}
    </div>
  );
};
