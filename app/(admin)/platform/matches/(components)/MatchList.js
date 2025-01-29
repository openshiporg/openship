import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useQueryParamsFromLocalStorage } from "@keystone/utils/useQueryParamsFromLocalStorage";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import { useToasts } from "@keystone/screens";
import { useDrawer } from "@keystone/themes/Tailwind/orion/components/Modals/drawer-context";
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

  const { data, error, refetch } = useQuery(
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

  const renderMatchList = () => {
    if (!data) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
      <div className="flex flex-col divide-y">
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
    );
  };

  return (
    <>
      {metaQuery.error ? (
        "Error..."
      ) : metaQuery.data ? (
        <main className="w-full max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Matches</h1>
              <p className="text-muted-foreground">
                Manage product matches between shops and channels
              </p>
            </div>
          </div>

          <div className="no-scrollbar overflow-x-auto border rounded-lg divide-y dark:bg-zinc-950">
            <div className="flex gap-3 py-3 px-3">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                <form onSubmit={handleSearch}>
                  <Input
                    type="search"
                    className="w-full rounded-md bg-muted/40 pl-10"
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

            <div className="flex flex-col items-start bg-zinc-300/20 dark:bg-muted/10 px-3 py-2">
              <div className="flex flex-wrap gap-2 w-full items-center">
                <PaginationNavigation
                  list={list}
                  total={data?.count}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />
                <PaginationDropdown
                  list={list}
                  total={data?.count}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />
                <SortSelection
                  list={list}
                  orderableFields={orderableFields}
                  currentSortBy={sort?.field}
                  currentSortOrder={sort?.direction}
                  handleSortChange={(newSort) => {
                    const currentSearchParams = new URLSearchParams(
                      searchParams.toString()
                    );
                    if (newSort) {
                      currentSearchParams.set(
                        "sortBy",
                        `${newSort.direction === "DESC" ? "-" : ""}${
                          newSort.field
                        }`
                      );
                    } else {
                      currentSearchParams.delete("sortBy");
                    }
                    push(`?${currentSearchParams.toString()}`);
                  }}
                />
                <FilterAdd
                  listKey={listKey}
                  filterableFields={filterableFields}
                />
              </div>
            </div>

            {filters.filters.length > 0 && (
              <div className="py-2 px-3">
                <FilterList filters={filters.filters} list={list} />
              </div>
            )}

            <div className="pb-1 pr-2 pl-3.5">
              <PaginationStats
                list={list}
                total={data?.count || 0}
                currentPage={currentPage}
                pageSize={pageSize}
              />
            </div>

            {data?.items?.length ? (
              renderMatchList()
            ) : (
              <div>
                <div className="flex flex-col items-center p-10 border-dashed border-2 rounded-lg m-5">
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
                          const newSearchParams = new URLSearchParams(
                            searchParams
                          );
                          newSearchParams.delete("search");
                          push(`?${newSearchParams.toString()}`);
                          refetch();
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
              </div>
            )}
          </div>
        </main>
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </>
  );
};

export default MatchList;

