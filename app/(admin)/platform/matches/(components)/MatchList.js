import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import { DeleteManyButton } from "@keystone/themes/Tailwind/orion/components/DeleteManyButton";
import {
  Search,
  ArrowUpDown,
  Filter,
  PlusIcon,
  SquareArrowRight,
  Triangle,
  Circle,
  Square,
  ChevronRight,
  ChevronsUpDown,
  AlertTriangle,
  Box,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Check,
  MoreVertical,
  MoreHorizontal,
  ChevronDown,
  ArrowLeft,
  X,
} from "lucide-react";
import { FilterAdd } from "@keystone/themes/Tailwind/orion/components/FilterAdd";
import { FilterList } from "@keystone/themes/Tailwind/orion/components/FilterList";
import { SortSelection } from "@keystone/themes/Tailwind/orion/components/SortSelection";
import {
  Pagination,
  PaginationDropdown,
  PaginationNavigation,
  PaginationStats,
} from "@keystone/themes/Tailwind/orion/components/Pagination";
import { CreateButtonLink } from "@keystone/themes/Tailwind/orion/components/CreateButtonLink";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Badge, BadgeButton } from "@ui/badge";

import { LoadingIcon } from "@keystone/screens";

import { useUpdateItem } from "@keystone/themes/Tailwind/orion/components/EditItemDrawer";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { MatchCard } from "./MatchCard";
import { Skeleton } from "@keystone/themes/Tailwind/orion/primitives/default/ui/skeleton";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ScrollArea } from "@keystone/themes/Tailwind/orion/primitives/default/ui/scroll-area";
import { RiBarChartFill } from "@remixicon/react";

const listMetaGraphqlQuery = gql`
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

const UPDATE_SHOP_PRODUCT_MUTATION = gql`
  mutation UpdateShopProduct(
    $shopId: ID!
    $variantId: ID!
    $productId: ID!
    $inventoryDelta: Int
  ) {
    updateShopProduct(
      shopId: $shopId
      variantId: $variantId
      productId: $productId
      inventoryDelta: $inventoryDelta
    ) {
      error
      success
      updatedVariant {
        inventory
      }
    }
  }
`;

const BaseToolbar = (props) => (
  <div className="border-t flex flex-wrap justify-between bg-muted/40 gap-2 p-4 mt-auto">
    {props.children}
  </div>
);

// Custom pagination components
const CustomPaginationStats = ({ list, currentPage, total, pageSize }) => {
  let stats;

  if (total > pageSize) {
    const start = pageSize * (currentPage - 1) + 1;
    const end = Math.min(start + pageSize - 1, total);
    stats = (
      <>
        <strong>{start}</strong>{" "}
        {start !== end ? (
          <>
            - <strong>{end}</strong>
          </>
        ) : (
          ""
        )}{" "}
        of <strong>{total}</strong> {list.plural.toLowerCase()}
      </>
    );
  } else {
    if (total > 1 && list.plural) {
      stats = (
        <>
          <strong>{total}</strong> {list.plural.toLowerCase()}
        </>
      );
    } else if (total === 1 && list.singular.toLowerCase()) {
      stats = (
        <>
          <strong>{total}</strong> {list.singular.toLowerCase()}
        </>
      );
    } else {
      stats = <>0 {list.plural.toLowerCase()}</>;
    }
  }

  return <span className="text-xs text-muted-foreground uppercase">Showing {stats}</span>;
};

const CustomPaginationNavigation = ({ currentPage, total, pageSize }) => {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = {};

  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const minPage = 1;
  const limit = Math.ceil(total / pageSize);

  const getQueryString = (newParams) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key]);
    });
    return allParams.toString();
  };

  const handlePageChange = (newPage) => {
    const page = Math.max(minPage, Math.min(limit, Number(newPage)));
    const newQuery = getQueryString({ page });
    router.push(`${pathname}?${newQuery}`);
    setCurrentPageInput(page.toString());
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setCurrentPageInput(newValue);
    }
  };

  const handleInputBlur = () => {
    if (currentPageInput === "") {
      setCurrentPageInput(currentPage.toString());
    } else {
      handlePageChange(currentPageInput);
    }
  };

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="[&_svg]:size-3.5 w-5 h-5 text-muted-foreground"
        onClick={() => handlePageChange(parseInt(currentPageInput) - 1)}
        disabled={parseInt(currentPageInput) <= minPage}
      >
        <ArrowLeft />
      </Button>
      <div className="flex items-center text-xs text-muted-foreground">
        <input
          className="w-4 bg-transparent border-0 text-muted-foreground focus:ring-0 text-center appearance-none"
          type="text"
          value={currentPageInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePageChange(e.target.value);
            }
          }}
        />
        <span className="mx-0.5">/ {limit}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="[&_svg]:size-3.5 w-5 h-5 text-muted-foreground"
        onClick={() => handlePageChange(parseInt(currentPageInput) + 1)}
        disabled={parseInt(currentPageInput) >= limit}
      >
        <ArrowRight />
      </Button>
    </div>
  );
};

const CustomPaginationDropdown = ({ currentPage, total, pageSize }) => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const pageSizeOptions = [1, 5, 10, 25, 50, 100];
  const [pageSizeInput, setPageSizeInput] = useState(pageSize.toString());
  const [selectedPageSize, setSelectedPageSize] = useState(
    pageSizeOptions.includes(pageSize) ? pageSize : "Custom"
  );
  const [isCustomizing, setIsCustomizing] = useState(false);

  const getQueryString = (newParams) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key]);
    });
    return allParams.toString();
  };

  const handlePageSizeInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setPageSizeInput(newValue);
    }
  };

  const handlePageSizeInputCommit = (value) => {
    const newSize = Math.max(1, parseInt(value, 10) || 1);
    const newQuery = getQueryString({ pageSize: newSize });
    push(`${pathname}?${newQuery}`);
    setSelectedPageSize(newSize);
    setPageSizeInput(newSize.toString());
    setIsCustomizing(false);
  };

  const handlePageSizeInputCancel = () => {
    setSelectedPageSize(pageSize);
    setPageSizeInput(pageSize.toString());
    setIsCustomizing(false);
  };

  const handlePageSizeChange = (newSize) => {
    if (newSize === "Custom") {
      setSelectedPageSize("Custom");
      setPageSizeInput(pageSize.toString());
      setIsCustomizing(true);
    } else {
      const size = Math.max(1, Number(newSize));
      const newQuery = getQueryString({ pageSize: size });
      push(`${pathname}?${newQuery}`);
      setSelectedPageSize(size);
      setPageSizeInput(size.toString());
      setIsCustomizing(false);
    }
  };

  const CustomInput = () => (
    <div className="flex items-center">
      <input
        className="w-10 bg-transparent border-0 text-muted-foreground focus:ring-0 text-xs text-center appearance-none"
        type="text"
        value={pageSizeInput}
        onChange={handlePageSizeInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handlePageSizeInputCommit(e.target.value);
          }
        }}
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 text-muted-foreground"
        onClick={handlePageSizeInputCancel}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 text-muted-foreground"
        onClick={() => handlePageSizeInputCommit(pageSizeInput)}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );

  return isCustomizing ? (
    <CustomInput />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="xs"
          className="uppercase py-1 px-0 text-xs text-muted-foreground [&_svg]:size-3"
        >
          {selectedPageSize} per page
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Page Size</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-72">
          {pageSizeOptions.map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={() => handlePageSizeChange(size)}
            >
              {size}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => handlePageSizeChange("Custom")}>
            Custom
          </DropdownMenuItem>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const MatchList = ({ onMatchAction, showCreate }) => {
  const listKey = "Match";
  const list = useList(listKey);
  const { push } = useRouter();
  const searchParams = useSearchParams();

  const query = Object.fromEntries(searchParams);

  const currentPage = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || list.pageSize;

  const [searchString, setSearchString] = useState(query.search || "");

  const metaQuery = useQuery(listMetaGraphqlQuery, { variables: { listKey } });

  const { listViewFieldModesByField, filterableFields, orderableFields } =
    useMemo(() => {
      const listViewFieldModesByField = {};
      const orderableFields = new Set();
      const filterableFields = new Set();
      for (const field of metaQuery.data?.keystone.adminMeta.list?.fields ||
        []) {
        listViewFieldModesByField[field.path] = field.listView.fieldMode;
        if (field.isOrderable) orderableFields.add(field.path);
        if (field.isFilterable) filterableFields.add(field.path);
      }
      return { listViewFieldModesByField, orderableFields, filterableFields };
    }, [metaQuery.data?.keystone.adminMeta.list?.fields]);

  const sort = useSort(list, orderableFields);
  const filters = useFilters(list, filterableFields);
  const searchFields = Object.keys(list.fields).filter(
    (key) => list.fields[key].search
  );
  const search = useFilter(searchString, list, searchFields);

  let selectedFields = useSelectedFields(list, listViewFieldModesByField);

  const { data, error, refetch, loading } = useQuery(
    useMemo(() => {
      let selectedGqlFields = `
        id
        input {
          id
          quantity
          productId
          variantId
          lineItemId
          externalDetails {
            title
            image
            price
            productLink
            inventory
            inventoryTracked
            error
          }
          shop {
            id
            name
          }
        }
        output {
          id
          quantity
          productId
          variantId
          lineItemId
          priceChanged
          externalDetails {
            title
            image
            price
            productLink
            inventory
            inventoryTracked
            error
          }
          price
          channel {
            id
            name
          }
        }
        createdAt
        outputPriceChanged
        inventoryNeedsToBeSynced {
          syncEligible
          sourceQuantity
          targetQuantity
        }
      `;

      return gql`
        query ($where: ${list.gqlNames.whereInputName}, $take: Int!, $skip: Int!, $orderBy: [${list.gqlNames.listOrderName}!]) {
          items: ${list.gqlNames.listQueryName}(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
            ${selectedGqlFields}
          }
          count: ${list.gqlNames.listQueryCountName}(where: $where)
        }
      `;
    }, [list, selectedFields]),
    {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
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

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  const handleSearch = (e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("search", searchString);
    push(`?${newSearchParams.toString()}`);
  };

  const {
    handleUpdate: updateChannelItem,
    updateLoading: updateChannelItemLoading,
  } = useUpdateItem("ChannelItem");
  const [updateShopProduct, { loading: updateShopProductLoading }] =
    useMutation(UPDATE_SHOP_PRODUCT_MUTATION);

  const handleAcceptPriceChange = async (channelItemId, newPrice) => {
    try {
      await updateChannelItem(channelItemId, { price: newPrice });
      refetch();
    } catch (error) {
      console.error("Error updating channel item price:", error);
    }
  };

  const handleSyncInventory = async (match) => {
    if (!match.inventoryNeedsToBeSynced?.syncEligible) {
      console.error("Inventory sync is not eligible for this match");
      return;
    }

    const input = match.input[0];
    const { shop, productId, variantId } = input;
    const { sourceQuantity, targetQuantity } = match.inventoryNeedsToBeSynced;
    const inventoryDelta = targetQuantity - sourceQuantity;

    try {
      await updateShopProduct({
        variables: {
          shopId: shop.id,
          productId,
          variantId,
          inventoryDelta,
        },
      });
      refetch();
    } catch (error) {
      console.error("Error updating shop product inventory:", error);
    }
  };

  const [selectedItemsState, setSelectedItems] = useState(() => ({
    itemsFromServer: undefined,
    selectedItems: new Set(),
  }));

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

  const resetToDefaults = () => {
    setSearchString("");
    const path = window.location.pathname;
    push(path);
  };

  return (
    <div className="overflow-hidden h-full flex flex-col">
      {metaQuery.error ? (
        "Error..."
      ) : metaQuery.data ? (
        <main className="flex flex-col h-full flex-1">
          <div className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                    }}
                  >
                    <Input
                      type="search"
                      className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm"
                      value={searchString}
                      onChange={(e) => setSearchString(e.target.value)}
                      placeholder={`Search by ${
                        searchFields.length
                          ? searchFields.join(", ").toLowerCase()
                          : "ID"
                      }`}
                    />
                  </form>
                </div>
              </div>
              <FilterAdd listKey={listKey} filterableFields={filterableFields}>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                >
                  <Filter className="stroke-muted-foreground" />
                  <span className="hidden lg:inline">Filter</span>
                </Button>
              </FilterAdd>
            </div>

            {filters.filters.length > 0 && (
              <FilterList filters={filters.filters} list={list} />
            )}
          </div>

          {data?.items?.length ? (
            <>
              <div className="flex flex-col flex-1 px-4 overflow-auto">
                <div className="flex items-center justify-between sticky top-0 z-10 bg-background pt-1">
                  <div className="flex items-center">
                    <SortSelection
                      list={list}
                      orderableFields={orderableFields}
                    >
                      <Button
                        variant="link"
                        size="xs"
                        className="uppercase py-1 px-0 text-xs text-muted-foreground [&_svg]:size-3"
                      >
                        Sorting by{" "}
                        {sort ? (
                          <>
                            {list.fields[sort.field].label}
                            {sort.direction === "ASC" ? (
                              <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">
                                ASC
                              </Badge>
                            ) : (
                              <Badge className="h-4 border py-0 px-1 text-[.5rem] leading-[.85rem] -mr-1">
                                DESC
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>default</>
                        )}
                        <ChevronDown />
                      </Button>
                    </SortSelection>
                  </div>

                  <div className="flex items-center gap-3">
                    <CustomPaginationStats
                      list={list}
                      total={data.count}
                      currentPage={currentPage}
                      pageSize={pageSize}
                    />
                    <CustomPaginationNavigation
                      list={list}
                      total={data.count}
                      currentPage={currentPage}
                      pageSize={pageSize}
                    />
                    <CustomPaginationDropdown
                      list={list}
                      total={data.count}
                      currentPage={currentPage}
                      pageSize={pageSize}
                    />
                  </div>
                </div>

                <div className="divide-y border rounded-lg mb-4">
                  {dataGetter.get("items").data.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onMatchAction={onMatchAction}
                      handleAcceptPriceChange={handleAcceptPriceChange}
                      handleSyncInventory={handleSyncInventory}
                      updateChannelItemLoading={updateChannelItemLoading}
                      updateShopProductLoading={updateShopProductLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Commented out BaseToolbar as requested */}
              {/* <BaseToolbar>
                {selectedItemsState.selectedItems.size > 0 ? (
                  <div className="w-full flex flex-wrap gap-4 items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      <strong>{selectedItemsState.selectedItems.size}</strong>{" "}
                      selected
                    </span>
                    <DeleteManyButton
                      list={list}
                      selectedItems={selectedItemsState.selectedItems}
                      refetch={refetch}
                    />
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
              </BaseToolbar> */}
            </>
          ) : loading ? (
            <div className="flex-1 p-4">
              <Skeleton className="w-full h-20 mt-4" />
            </div>
          ) : (
            <div className="flex flex-col items-center p-10 border rounded-lg flex-1 mx-4">
              <div className="flex opacity-40">
                <RiBarChartFill
                  className="mx-auto h-7 w-7 text-muted-foreground"
                  aria-hidden={true}
                />
              </div>
              {searchString || filters.filters.length ? (
                <>
                  <span className="pt-4 font-medium text-foreground">
                    No <span className="lowercase">{list.label}</span> found
                  </span>
                  <span className="text-sm text-muted-foreground pb-4">
                    {searchString
                      ? `No matches matching your search`
                      : `No matches matching your filters`}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchString("");
                      resetToDefaults();
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <span className="pt-4 font-medium text-foreground">
                    No matches created
                  </span>
                  <span className="text-sm text-muted-foreground pb-4">
                    Create matches to link products between shops and channels
                  </span>
                  {showCreate && (
                    <Button
                      onClick={() => document.querySelector('[aria-label="Create Match"]')?.click()}
                      className="mt-2"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create Match
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <LoadingIcon label="Loading item data" />
        </div>
      )}
    </div>
  );
};

export default MatchList;
