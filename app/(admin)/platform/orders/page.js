"use client";
import React, { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useQuery,
  useMutation,
  useApolloClient,
  gql,
} from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useQueryParamsFromLocalStorage } from "@keystone/utils/useQueryParamsFromLocalStorage";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import { useToasts } from "@keystone/screens";
import { useDrawer } from "@keystone/themes/Tailwind/orion/components/Modals/drawer-context";
import { OrderDetailsComponent } from "./(components)/OrderDetailsComponent";
import { StatusShopFilter } from "./(components)/StatusShopFilter";
import { ProcessOrdersDialog } from "./(components)/ProcessOrdersDialog";
import { OrderDetailsDialog } from "../shops/(components)/OrderDetailsDialog";
import { SearchOrders } from "../shops/(components)/SearchOrders";
import { CreateButtonLink } from "@keystone/themes/Tailwind/orion/components/CreateButtonLink";
import { FilterAdd } from "@keystone/themes/Tailwind/orion/components/FilterAdd";
import { FilterList } from "@keystone/themes/Tailwind/orion/components/FilterList";
import { SortSelection } from "@keystone/themes/Tailwind/orion/components/SortSelection";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import { LoadingIcon } from "@keystone/themes/Tailwind/orion/components/LoadingIcon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/breadcrumb";
import {
  Pagination,
  PaginationDropdown,
  PaginationNavigation,
  PaginationStats,
} from "@keystone/themes/Tailwind/orion/components/Pagination";
import { Input } from "@keystone/themes/Tailwind/orion/primitives/default/ui/input";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/dialog";
import {
  ArrowUpDown,
  Circle,
  Search,
  Square,
  SquareArrowRight,
  Triangle,
  PlusCircleIcon,
  PlusIcon2,
  ChevronDown,
  SearchIcon,
  Filter,
  ArrowRight,
  ChevronRight,
  ListFilter,
  FilterIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@ui/dropdown-menu";
import {
  ArrowPathRoundedSquareIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";

import { OrdersTable } from "./(components)/OrdersTable";
import { AdminLink } from "@keystone/themes/Tailwind/orion/components/AdminLink";
import { PageBreadcrumbs } from "@keystone/themes/Tailwind/orion/components/PageBreadcrumbs";
import { ScrollArea, ScrollBar } from "@ui/scroll-area";

const PLACE_ORDERS = gql`
  mutation PLACE_ORDERS($ids: [ID!]!) {
    placeOrders(ids: $ids) {
      orderId
    }
  }
`;

const ADDMATCHTOCART_MUTATION = gql`
  mutation ADDMATCHTOCART_MUTATION($orderId: ID!) {
    addMatchToCart(orderId: $orderId) {
      id
    }
  }
`;

const ADD_TO_CART_MUTATION = gql`
  mutation ADD_TO_CART_MUTATION(
    $channelId: ID
    $image: String
    $name: String
    $price: String
    $productId: String
    $variantId: String
    $quantity: String
    $orderId: ID
  ) {
    addToCart(
      channelId: $channelId
      image: $image
      name: $name
      price: $price
      productId: $productId
      variantId: $variantId
      quantity: $quantity
      orderId: $orderId
    ) {
      id
      orderId
      orderName
    }
  }
`;

const MATCHORDER_MUTATION = gql`
  mutation MATCHORDER_MUTATION($orderId: ID!) {
    matchOrder(orderId: $orderId) {
      id
      input {
        id
        quantity
        productId
        variantId
      }
      output {
        id
        quantity
        productId
        variantId
      }
    }
  }
`;

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

const ALL_SHOPS_QUERY = gql`
  query ALL_SHOPS_QUERY {
    shops {
      id
      name
    }
  }
`;

const ORDERSCOUNT_QUERY = gql`
  query ORDERSCOUNT_QUERY($shop: ShopWhereInput) {
    pendingCount: ordersCount(
      where: { status: { equals: "PENDING" }, shop: $shop }
    )
    inprocessCount: ordersCount(
      where: { status: { equals: "INPROCESS" }, shop: $shop }
    )
    awaitingCount: ordersCount(
      where: { status: { equals: "AWAITING" }, shop: $shop }
    )
    backorderedCount: ordersCount(
      where: { status: { equals: "BACKORDERED" }, shop: $shop }
    )
    cancelledCount: ordersCount(
      where: { status: { equals: "CANCELLED" }, shop: $shop }
    )
    completeCount: ordersCount(
      where: { status: { equals: "COMPLETE" }, shop: $shop }
    )
  }
`;

const CHANNELS_QUERY = gql`
  query GetChannels {
    channels {
      id
      name
    }
  }
`;

const ORDERS_QUERY = gql`
  query ORDERS_QUERY(
    $where: OrderWhereInput
    $take: Int!
    $skip: Int!
    $orderBy: [OrderOrderByInput!]
  ) {
    items: orders(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
      id
      orderId
      orderLink
      orderName
      email
      firstName
      lastName
      streetAddress1
      streetAddress2
      city
      state
      zip
      orderError
      cartItemsCount
      lineItemsCount
      shop {
        id
        name
        domain
        accessToken
      }
      currency
      totalPrice
      subTotalPrice
      totalDiscount
      totalTax
      status
      createdAt
      readyToProcess
    }
    count: ordersCount(where: $where)
  }
`;

const BaseToolbar = (props) => (
  <div className="-mb-4 md:-mb-6 shadow-md bottom-0 border border-b-0 flex flex-wrap justify-between p-3 rounded-t-xl sticky z-20 mt-8 bg-muted/40 gap-2">
    {props.children}
  </div>
);

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

export const OrderPage = () => {
  const client = useApolloClient();
  const listKey = "Order";
  const list = useList(listKey);
  const { openEditDrawer } = useDrawer();
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  const { resetToDefaults } = useQueryParamsFromLocalStorage(listKey);
  const currentPage = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || list.pageSize;
  const metaQuery = useQuery(listMetaGraphqlQuery, { variables: { listKey } });
  const [placeOrders] = useMutation(PLACE_ORDERS);
  const [addMatchToCart] = useMutation(ADDMATCHTOCART_MUTATION);
  const [addToCart] = useMutation(ADD_TO_CART_MUTATION);
  const [matchOrder] = useMutation(MATCHORDER_MUTATION);
  const [loadingActions, setLoadingActions] = useState({});
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const toasts = useToasts();
  const [isProcessOrdersDialogOpen, setIsProcessOrdersDialogOpen] =
    useState(false);
  const [processingOrders, setProcessingOrders] = useState([]);

  const { data: channelsData } = useQuery(CHANNELS_QUERY);

  const channels = channelsData?.channels || [];

  const selectedShop =
    searchParams.get("!shop_matches")?.replace(/^"|"$/g, "") || null;

  const statuses = [
    "PENDING",
    "INPROCESS",
    "AWAITING",
    "BACKORDERED",
    "CANCELLED",
    "COMPLETE",
  ];
  const { data: shopsData } = useQuery(ALL_SHOPS_QUERY);

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
  const searchLabels = searchFields.map((key) => list.fields[key].label);
  const searchParam = typeof query.search === "string" ? query.search : "";
  const [searchString, updateSearchString] = useState(searchParam);
  const search = useFilter(searchParam, list, searchFields);

  const updateSearch = (value) => {
    const { search, ...queries } = query;
    const newQueryString = new URLSearchParams(queries).toString();
    if (value.trim()) {
      const searchQuery = `search=${encodeURIComponent(value)}`;
      const queryString = newQueryString
        ? `${newQueryString}&${searchQuery}`
        : searchQuery;
      push(`?${queryString}`);
    } else {
      push(`?${newQueryString}`);
    }
  };

  let selectedFields = useSelectedFields(list, listViewFieldModesByField);

  const { data: orderCounts, refetch: refetchOrderCounts } = useQuery(
    ORDERSCOUNT_QUERY,
    {
      variables: {
        ...(selectedShop ? { shop: filters.where.shop } : {}),
      },
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    }
  );

  let { data, error, refetch } = useQuery(ORDERS_QUERY, {
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
  });

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

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

  const showCreate =
    !(metaQuery.data?.keystone.adminMeta.list?.hideCreate ?? true) || null;

  const handleOrderAction = async (action, orderId, additionalData) => {
    setLoadingActions((prev) => ({ ...prev, [action]: { [orderId]: true } }));
    try {
      switch (action) {
        case "getMatch":
          await addMatchToCart({ variables: { orderId } });
          toasts.addToast({
            title: "Match added to cart",
            tone: "positive",
          });
          break;
        case "saveMatch":
          await matchOrder({ variables: { orderId } });
          toasts.addToast({
            title: "Match saved",
            tone: "positive",
          });
          break;
        case "placeOrder":
          await placeOrders({ variables: { ids: [orderId] } });
          toasts.addToast({
            title: "Order placed successfully",
            tone: "positive",
          });
          break;
        case "addToCart":
          const {
            channelId,
            image,
            name,
            price,
            productId,
            variantId,
            quantity,
          } = additionalData;
          await addToCart({
            variables: {
              channelId,
              image,
              name,
              price,
              productId,
              variantId,
              quantity: quantity.toString(),
              orderId,
            },
          });
          toasts.addToast({
            title: "Item added to cart",
            tone: "positive",
          });
          break;
        case "editOrder":
          openEditDrawer(orderId, "Order");
          break;
        case "deleteOrder":
          // Implement delete order logic here
          toasts.addToast({
            title: "Order deleted",
            tone: "positive",
          });
          break;
        default:
          console.log("Unknown action:", action);
      }

      await client.refetchQueries({
        include: "active",
      });
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toasts.addToast({
        title: `Error performing ${action}`,
        tone: "negative",
        message: error.message,
      });
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        [action]: { [orderId]: false },
      }));
    }
  };

  const handleCreateOrder = (type) => {
    if (type === "scratch") {
      setSelectedOrder("scratch");
    } else {
      setIsCreateOrderDialogOpen(true);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setIsCreateOrderDialogOpen(false);
  };

  const handleProcessAll = async () => {
    setIsProcessOrdersDialogOpen(true);
  };

  const processSelectedOrders = async (selectedOrderIds) => {
    setLoadingActions((prev) => ({ ...prev, processAll: true }));
    setProcessingOrders(selectedOrderIds);
    try {
      await placeOrders({ variables: { ids: selectedOrderIds } });
      toasts.addToast({
        title: "Orders processed successfully",
        tone: "positive",
      });
      // await refetch();
      // await refetchOrderCounts();

      await client.refetchQueries({
        include: "active",
      });
    } catch (error) {
      console.error("Error processing orders:", error);
      toasts.addToast({
        title: "Error processing orders",
        tone: "negative",
        message: error.message,
      });
    } finally {
      setLoadingActions((prev) => ({ ...prev, processAll: false }));
      setProcessingOrders([]);
      setIsProcessOrdersDialogOpen(false);
    }
  };

  const qualifyingOrders = useMemo(() => {
    return (
      data?.items?.filter((order) => order.readyToProcess === "READY") || []
    );
  }, [data]);

  return (
    <div className="h-screen overflow-hidden">
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
            label: "Orders",
          },
        ]}
      />
      {metaQuery.error ? (
        "Error..."
      ) : metaQuery.data ? (
        <main className="w-full h-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Title Section */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold">{list.label}</h1>
              <p className="text-muted-foreground">
                {list.description ||
                  `Create and manage ${list.label.toLowerCase()}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
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
              <FilterAdd listKey={listKey} filterableFields={filterableFields}>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
                >
                  <FilterIcon className="stroke-muted-foreground" />
                  <span className="hidden lg:inline">Filter</span>
                </Button>
              </FilterAdd>

              <Button
                variant="outline"
                onClick={handleProcessAll}
                disabled={qualifyingOrders.length === 0}
                className="lg:px-4 lg:py-2 rounded-lg"
              >
                Process Orders
                <span className="ml-2 bg-primary text-primary-foreground rounded-md w-4 h-4 flex items-center justify-center text-xs">
                  {qualifyingOrders.length}
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-lg">
                    <DiamondPlus />
                    Create Order
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleCreateOrder("scratch")}
                    className="text-muted-foreground flex gap-2 font-medium"
                  >
                    <PlusIcon className="h-4 w-4" />
                    From Scratch
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsCreateOrderDialogOpen(true)}
                    className="text-muted-foreground flex gap-2 font-medium"
                  >
                    <ArrowPathRoundedSquareIcon className="h-4 w-4" />
                    From Existing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {filters.filters.filter((filter) => filter.field !== "status")
              .length > 0 && (
              <div className="flex gap-1.5 mt-1 border bg-muted/40 rounded-lg p-2 items-center">
                <div className="flex items-center gap-1.5 border-r border-muted-foreground/30 pr-2 mr-1.5">
                  <FilterIcon
                    className="stroke-muted-foreground/50 size-4"
                    strokeWidth={1.5}
                  />
                </div>
                <FilterList
                  filters={filters.filters.reduce((acc, filter) => {
                    if (filter.field !== "status") {
                      acc.push(filter);
                    }
                    return acc;
                  }, [])}
                  list={list}
                />
              </div>
            )}

            {/* Filters and Sort Row */}
            <div className="flex flex-col gap-2">
              <StatusShopFilter statuses={statuses} orderCounts={orderCounts} />

              <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Table Section */}
          {data?.count ? (
            <>
              <div className="flex flex-col flex-1 min-h-0 mb-8">
                <ScrollArea className="h-auto border rounded-lg">
                  <OrdersTable
                    data={data}
                    error={error}
                    listKey={listKey}
                    list={list}
                    handleOrderAction={handleOrderAction}
                    openEditDrawer={openEditDrawer}
                    channels={channels}
                    loadingActions={loadingActions}
                    query={query}
                    filters={filters}
                    searchParam={searchParam}
                    updateSearchString={updateSearchString}
                    push={push}
                    showCreate={showCreate}
                  />
                </ScrollArea>
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

          {/* Keep existing dialogs */}
          <OrderDetailsDialog
            isOpen={selectedOrder !== null}
            onClose={() => setSelectedOrder(null)}
            order={selectedOrder === "scratch" ? null : selectedOrder}
            shopId={selectedOrder?.shop?.id}
          />
          <ProcessOrdersDialog
            isOpen={isProcessOrdersDialogOpen}
            onClose={() => setIsProcessOrdersDialogOpen(false)}
            orders={qualifyingOrders}
            onProcessOrders={processSelectedOrders}
            processingOrders={processingOrders}
          />
        </main>
      ) : null}
    </div>
  );
};

export default OrderPage;
