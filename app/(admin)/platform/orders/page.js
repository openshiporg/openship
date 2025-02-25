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
import { RiBarChartFill } from "@remixicon/react";

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
  query GetOrdersCounts {
    pendingCount: ordersCount(where: { status: { equals: "PENDING" } })
    inprocessCount: ordersCount(where: { status: { equals: "INPROCESS" } })
    awaitingCount: ordersCount(where: { status: { equals: "AWAITING" } })
    backorderedCount: ordersCount(where: { status: { equals: "BACKORDERED" } })
    cancelledCount: ordersCount(where: { status: { equals: "CANCELLED" } })
    completeCount: ordersCount(where: { status: { equals: "COMPLETE" } })
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

const statusConfig = {
  pending: {
    label: "Pending",
    color: "amber",
  },
  inprocess: {
    label: "In Process",
    color: "blue",
  },
  awaiting: {
    label: "Awaiting",
    color: "purple",
  },
  backordered: {
    label: "Backordered",
    color: "orange",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
  },
  complete: {
    label: "Complete",
    color: "emerald",
  },
};

function OrderStatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: orderCounts, loading } = useQuery(ORDERSCOUNT_QUERY);

  const currentStatus = searchParams.get("status") || "pending";

  const handleStatusChange = (status) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status.toUpperCase());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative">
      <ScrollArea className="w-full" orientation="horizontal">
        <div className="flex space-x-[6px] items-center pb-1">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orderCounts?.[`${status}Count`] || 0;
            return (
              <div
                key={status}
                className={`px-3 py-2 cursor-pointer transition-colors duration-300 ${
                  currentStatus === status
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => handleStatusChange(status)}
              >
                <div className="text-sm font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
                  <Badge
                    color={config.color}
                    className="mr-2 rounded-full border-2 w-3 h-3 p-0"
                  />
                  {config.label}
                  <span className="ml-2 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {loading ? "-" : count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

const OrdersTableSkeleton = () => {
  return (
    <div className="divide-y">
      {[1, 2, 3].map((row) => (
        <div key={row} className="w-full bg-muted animate-pulse h-24"></div>
      ))}
    </div>
  );
};

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
  const [searchString, setSearchString] = useState(searchParam);
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

  let { data, error, loading, refetch } = useQuery(ORDERS_QUERY, {
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

  const EmptyState = () => {
    // Check if any filters are active via filters.where or search string is non-empty
    const hasFilters =
      Object.keys(filters?.where || {}).length > 0 ||
      searchString.trim() !== "";
    return (
      <div className="m-4 flex h-72 items-center justify-center rounded-lg border bg-muted">
        <div className="text-center">
          <RiBarChartFill
            className="mx-auto h-7 w-7 text-muted-foreground"
            aria-hidden="true"
          />
          {hasFilters ? (
            <>
              <p className="mt-2 font-medium text-foreground">
                No orders match your current filters.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing your filters to see more orders.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => resetToDefaults()}>
                  Clear Filters
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 font-medium text-foreground">
                No orders found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Orders will appear here once they're created or imported from
                your shops.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleCreateOrder("scratch")}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
                <Button onClick={() => setIsCreateOrderDialogOpen(true)}>
                  <ArrowPathRoundedSquareIcon className="mr-2 h-4 w-4" />
                  Import Order
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="h-screen overflow-hidden flex flex-col">
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

      <div className="flex flex-col flex-1 min-h-0">
        {/* Title Section */}
        <div className="flex flex-col p-4">
          <h1 className="text-2xl font-semibold">{list.label}</h1>
          <p className="text-muted-foreground">
            {list.description ||
              `Create and manage ${list.label.toLowerCase()}`}
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2 px-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <form onSubmit={(e) => e.preventDefault()}>
              <Input
                type="search"
                className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm shadow-sm"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                placeholder="Search orders..."
              />
            </form>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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

            <Button
              variant="outline"
              onClick={() => setIsProcessOrdersDialogOpen(true)}
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
                  <DiamondPlus className="mr-2" />
                  Create Order
                  <ChevronDown
                    className="-me-1 ml-2 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
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
        </div>

        {/* Status and Shop Filter */}
        <div className="px-4 pb-0 border-b bg-background">
          <StatusShopFilter statuses={statuses} orderCounts={orderCounts} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {!loading && !data ? null : loading ? (
            <OrdersTableSkeleton />
          ) : data?.items?.length > 0 ? (
            <ScrollArea className="h-full">
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
                statusColors={statusConfig}
              />
            </ScrollArea>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Keep existing dialogs */}
      <Dialog
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Search Existing Orders</DialogTitle>
            <DialogDescription>
              Search for an existing order to edit or view details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
            <SearchOrders
              shops={shopsData?.shops || []}
              onOrderSelect={handleOrderSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
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
    </section>
  );
};

export default OrderPage;
