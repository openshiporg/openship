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
  <div className="border flex flex-wrap justify-between p-3 rounded-lg bg-muted/40 gap-2">
    {props.children}
  </div>
);

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

  return (
    <div className="overflow-hidden h-full">
      {metaQuery.error ? (
        "Error..."
      ) : metaQuery.data ? (
        <main className="flex flex-col h-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative max-w-[300px] min-w-[150px]">
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
              <div className="flex flex-col flex-1 mb-8 mt-2">
                <div className="flex items-center gap-2 mb-1">
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
                <div className="divide-y border rounded-lg">
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

              <BaseToolbar>
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
              </BaseToolbar>
            </>
          ) : loading ? (
            <Skeleton className="w-full h-20 mt-4" />
          ) : (
            <div className="flex flex-col items-center p-10 border rounded-lg">
              <div className="flex opacity-40">
                <Triangle className="w-8 h-8 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950" />
                <Circle className="w-8 h-8 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
                <Square className="w-8 h-8 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950" />
              </div>
              {searchString || filters.filters.length ? (
                <>
                  <span className="pt-4 font-semibold">
                    No <span className="lowercase">{list.label}</span>{" "}
                  </span>
                  <span className="text-muted-foreground pb-4">
                    Found{" "}
                    {searchString
                      ? `matching your search`
                      : `matching your filters`}{" "}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchString("");
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
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </div>
  );
};

export default MatchList;
