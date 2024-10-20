import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
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
import { FilterAdd } from "@keystone/themes/Tailwind/atlas/components/FilterAdd";
import { FilterList } from "@keystone/themes/Tailwind/atlas/components/FilterList";
import { SortSelection } from "@keystone/themes/Tailwind/atlas/components/SortSelection";
import {
  Pagination,
  PaginationDropdown,
  PaginationNavigation,
  PaginationStats,
} from "@keystone/themes/Tailwind/atlas/components/Pagination";
import { CreateButtonLink } from "@keystone/themes/Tailwind/atlas/components/CreateButtonLink";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Badge, BadgeButton } from "@ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@ui/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";
import { Separator } from "@ui/separator";
import { LoadingIcon } from "@keystone/screens";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/dropdown-menu";
import { useDrawer } from "@keystone/themes/Tailwind/atlas/components/Modals/drawer-context";
import { useUpdateItem } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";
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
        <main className="items-start gap-2 sm:py-0 md:gap-4">
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
                  dropdownTrigger={
                    <button
                      type="button"
                      className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    >
                      <ArrowUpDown
                        size={12}
                        className="stroke-muted-foreground"
                      />
                      SORT
                    </button>
                  }
                />
                <FilterAdd
                  listKey={listKey}
                  filterableFields={filterableFields}
                  dropdownTrigger={
                    <button
                      type="button"
                      className="flex gap-1.5 pr-2 pl-2 tracking-wider items-center text-xs shadow-sm border p-[.15rem] font-medium text-zinc-600 bg-white dark:bg-zinc-800 rounded-md hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
                    >
                      <PlusIcon size={13} className="stroke-muted-foreground" />
                      FILTER
                    </button>
                  }
                />
              </div>
            </div>

            {filters.filters.length > 0 && (
              <div className="py-2 px-3 flex gap-2">
                <div>
                  <Badge
                    color="zinc"
                    className="flex items-center gap-2 py-0.5 border text-muted-foreground text-xs font-medium tracking-wide uppercase"
                  >
                    <Filter className="w-2.5 h-2.5" />
                    Filters
                    <SquareArrowRight className="w-3 h-3 opacity-75" />
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <FilterList filters={filters.filters} list={list} />
                  </div>
                </div>
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
                        variant="secondary"
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

// export const MatchCard = ({
//   match,
//   onMatchAction,
//   handleAcceptPriceChange,
//   handleSyncInventory,
//   updateChannelItemLoading,
//   updateShopProductLoading,
// }) => {
//   const { openEditDrawer } = useDrawer();

//   return (
//     <div>
//       <MatchHeader
//         match={match}
//         openEditDrawer={openEditDrawer}
//         handleSyncInventory={() => handleSyncInventory(match)}
//         updateShopProductLoading={updateShopProductLoading}
//       >
//         <Separator />
//         <ProductDetailsCollapsible
//           items={match.input}
//           title="Shop Product"
//           openEditDrawer={openEditDrawer}
//         />
//         <Separator />
//         <ProductDetailsCollapsible
//           items={match.output}
//           title="Channel Product"
//           openEditDrawer={openEditDrawer}
//           onAcceptPriceChange={handleAcceptPriceChange}
//           updateChannelItemLoading={updateChannelItemLoading}
//         />
//       </MatchHeader>
//     </div>
//   );
// };

// const MatchHeader = ({
//   match,
//   children,
//   defaultOpen = false,
//   isLoading = false,
//   openEditDrawer,
//   handleSyncInventory,
//   updateShopProductLoading,
//   renderButtons, // Add this prop
// }) => {
//   const [isOpen, setIsOpen] = useState(defaultOpen);
//   const { inventoryNeedsToBeSynced } = match;

//   return (
//     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//       <div className="flex justify-between p-3 bg-muted/30">
//         <CollapsibleTrigger asChild>
//           <button
//             type="button"
//             className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-zinc-500 bg-white border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-blue-700 focus:text-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 dark:focus:ring-blue-500 dark:focus:text-white"
//           >
//             {match.id}
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </CollapsibleTrigger>
//         <div className="flex gap-2 items-center">
//           {inventoryNeedsToBeSynced?.syncEligible && (
//             <InventorySyncButton
//               syncEligible={true}
//               sourceQuantity={inventoryNeedsToBeSynced.sourceQuantity}
//               targetQuantity={inventoryNeedsToBeSynced.targetQuantity}
//               onSyncInventory={handleSyncInventory}
//               isLoading={updateShopProductLoading}
//             />
//           )}

//           {match.outputPriceChanged === true && (
//             <Button
//               variant="secondary"
//               className="ml-2 text-muted-foreground py-0"
//             >
//               <ArrowUpDown className="h-4 w-4 mr-1 text-blue-500" />
//               <span>Price Changed</span>
//             </Button>
//           )}
//           {isLoading && (
//             <Loader2 className="mt-0.5 ml-2 animate-spin text-blue-600" />
//           )}

//           <Button
//             variant="secondary"
//             size="sm"
//             className="p-1.5"
//             onClick={() => openEditDrawer(match.id, "Match")}
//           >
//             <MoreHorizontal className="h-3.5 w-3.5" />
//           </Button>
//         </div>
//       </div>
//       <CollapsibleContent>{children}</CollapsibleContent>
//     </Collapsible>
//   );
// };

// const InventorySyncButton = ({
//   syncEligible,
//   sourceQuantity,
//   targetQuantity,
//   onSyncInventory,
//   isLoading,
// }) => {
//   if (!syncEligible) return null;

//   if (sourceQuantity === targetQuantity) {
//     return (
//       <BadgeButton
//         color="emerald"
//         className="flex gap-2 items-center border text-xs font-medium tracking-wide uppercase py-[.3rem]"
//       >
//         <Check className="h-3 w-3" />
//         <span>Inventory Synced</span>
//       </BadgeButton>
//     );
//   }

//   return (
//     <Badge
//       color="red"
//       className="flex gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
//     >
//       <AlertTriangle className="h-3 w-3" />
//       <span>Inventory Needs Sync</span>
//       <Button
//         variant="secondary"
//         className="text-muted-foreground border bg-background -mr-1.5 py-0.5 px-1.5 text-xs"
//         onClick={onSyncInventory}
//         disabled={isLoading}
//         isLoading={isLoading}
//       >
//         <div className="flex items-center">
//           {sourceQuantity}
//           <ArrowRight className="h-3 w-3 mx-1 inline" />
//           {targetQuantity}
//         </div>
//       </Button>
//     </Badge>
//   );
// };

// const ProductDetailsCollapsible = ({
//   items,
//   title,
//   defaultOpen = true,
//   openEditDrawer,
//   onAcceptPriceChange,
//   updateChannelItemLoading,
// }) => {
//   const [isOpen, setIsOpen] = React.useState(defaultOpen);
//   const isShopProduct = title === "Shop Product";

//   return (
//     <Collapsible
//       open={isOpen}
//       onOpenChange={setIsOpen}
//       className={`flex flex-col gap-2 p-3 ${
//         isShopProduct
//           ? "bg-green-50/40 dark:bg-emerald-900/20"
//           : "bg-blue-50/30 dark:bg-indigo-900/10"
//       }`}
//     >
//       <CollapsibleTrigger asChild>
//         <button
//           type="button"
//           className={`flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
//             isShopProduct
//               ? "text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
//               : "text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
//           }`}
//         >
//           {items.length} {title}
//           {items.length > 1 && "s"}
//           <ChevronsUpDown className="h-4 w-4" />
//         </button>
//       </CollapsibleTrigger>
//       <CollapsibleContent className="space-y-2">
//         {items.map((item, index) => (
//           <div key={item.id + "-details-" + index}>
//             {item.externalDetails.error ? (
//               <div className="border bg-background rounded-sm flex overflow-hidden">
//                 <Badge
//                   color="red"
//                   className="m-2 py-2 rounded-sm border border-red-300 dark:border-red-800"
//                 >
//                   <AlertTriangle className="my-auto size-8 p-2" />
//                 </Badge>
//                 <div className="grid p-2">
//                   <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
//                     {item.shop?.name || item.channel?.name}
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     {item.productId} | {item.variantId}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     QTY: {item.quantity}
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="border p-2 bg-background rounded-sm flex justify-between gap-4">
//                 <div className="flex items-center gap-4">
//                   <img
//                     className="border rounded-sm h-12 w-12 object-cover"
//                     src={item.externalDetails?.image}
//                     alt={item.externalDetails?.title}
//                   />
//                   <div className="grid">
//                     <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
//                       {item.shop?.name || item.channel?.name}
//                     </div>
//                     <a
//                       href={item.externalDetails?.productLink}
//                       target="_blank"
//                       className="text-sm font-medium"
//                     >
//                       {item.externalDetails?.title ||
//                         "Details could not be fetched"}
//                     </a>
//                     <p className="text-xs text-muted-foreground">
//                       {item.productId} | {item.variantId}
//                     </p>
//                     {item.quantity > 1 ? (
//                       <div className="flex gap-2 items-center">
//                         <p className="text-sm dark:text-emerald-500 font-medium">
//                           $
//                           {(
//                             parseFloat(item.externalDetails?.price) *
//                             item.quantity
//                           ).toFixed(2)}
//                         </p>
//                         <p className="text-xs text-zinc-500">
//                           (${parseFloat(item.externalDetails?.price).toFixed(2)}{" "}
//                           x {item.quantity})
//                           {item.price &&
//                             item.price !== item.externalDetails?.price && (
//                               <span className="ml-1">
//                                 (was ${parseFloat(item.price).toFixed(2)})
//                               </span>
//                             )}
//                         </p>
//                       </div>
//                     ) : (
//                       <p className="text-sm dark:text-emerald-500 font-medium">
//                         ${parseFloat(item.externalDetails?.price).toFixed(2)}
//                         {item.price &&
//                           item.price !== item.externalDetails?.price && (
//                             <span className="ml-1 text-xs text-zinc-500">
//                               (was ${parseFloat(item.price).toFixed(2)})
//                             </span>
//                           )}
//                       </p>
//                     )}
//                     <p className="text-xs text-muted-foreground">
//                       INVENTORY:{" "}
//                       {item.externalDetails?.inventory !== null
//                         ? item.externalDetails?.inventory >= 1e9
//                           ? `${(item.externalDetails?.inventory / 1e9).toFixed(
//                               1
//                             )}B`
//                           : item.externalDetails?.inventory >= 1e6
//                           ? `${(item.externalDetails?.inventory / 1e6).toFixed(
//                               1
//                             )}M`
//                           : item.externalDetails?.inventory >= 1e3
//                           ? `${(item.externalDetails?.inventory / 1e3).toFixed(
//                               1
//                             )}k`
//                           : item.externalDetails?.inventory.toString()
//                         : "N/A"}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-2">
//                   {!isShopProduct && item.priceChanged !== 0 && (
//                     <div>
//                       <Badge
//                         color={item.priceChanged > 0 ? "red" : "green"}
//                         className="flex gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
//                       >
//                         {item.priceChanged > 0 ? (
//                           <>
//                             <ArrowUp className="h-3 w-3" />
//                             <span>
//                               Price Went Up $
//                               {Math.abs(item.priceChanged).toFixed(2)}
//                             </span>
//                           </>
//                         ) : (
//                           <>
//                             <ArrowDown className="h-3 w-3" />
//                             <span>
//                               Price Went Down $
//                               {Math.abs(item.priceChanged).toFixed(2)}
//                             </span>
//                           </>
//                         )}
//                         <Button
//                           variant="secondary"
//                           className="text-muted-foreground flex items-center border bg-background -mr-1.5 py-0 px-1.5 text-[.6rem]"
//                           onClick={() =>
//                             onAcceptPriceChange(
//                               item.id,
//                               item.externalDetails.price
//                             )
//                           }
//                           disabled={updateChannelItemLoading}
//                           isLoading={updateChannelItemLoading}
//                         >
//                           ACCEPT
//                         </Button>
//                       </Badge>
//                     </div>
//                   )}

//                   <div>
//                     <Button
//                       variant="secondary"
//                       size="sm"
//                       className="p-1"
//                       onClick={() =>
//                         openEditDrawer(
//                           item.id,
//                           isShopProduct ? "ShopItem" : "ChannelItem"
//                         )
//                       }
//                     >
//                       <MoreHorizontal className="h-3 w-3" />
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </CollapsibleContent>
//     </Collapsible>
//   );
// };

export default MatchList;
