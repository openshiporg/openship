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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/tabs";
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
} from "lucide-react";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "@ui/dropdown-menu";
import {
  ArrowPathRoundedSquareIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";

import { OrdersTable } from "./(components)/OrdersTable";
import { AdminLink } from "@keystone/themes/Tailwind/orion/components/AdminLink";

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
    <>
      {
        metaQuery.error ? (
          "Error..."
        ) : metaQuery.data ? (
          <main className="items-start gap-2 sm:py-0 md:gap-4">
            <div className="flex flex-col sm:flex-row mt-2 mb-4 gap-2 justify-between">
              <div className="flex-col items-center">
                <h1 className="text-xl font-semibold md:text-2xl">
                  {list.label}
                </h1>
                <p className="text-muted-foreground">
                  {list.description ||
                    `Create and manage ${list.label.toLowerCase()}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleProcessAll}
                  disabled={qualifyingOrders.length === 0}
                  className="h-9"
                >
                  Process Orders
                  {/* <Badge className="ml-2 border py-0.5 px-1.5">
                  {qualifyingOrders.length}
                </Badge> */}
                  <span className="ml-2 bg-primary text-primary-foreground rounded-md w-4 h-4 flex items-center justify-center text-xs">
                    {qualifyingOrders.length}
                  </span>
                </Button>
                <Dropdown>
                  <DropdownButton>
                    Create Order <ChevronDown className="h-3 w-3 ml-2" />
                  </DropdownButton>
                  <DropdownMenu anchor="bottom end">
                    <DropdownItem
                      onClick={() => handleCreateOrder("scratch")}
                      className="text-muted-foreground flex gap-2 font-medium tracking-wide uppercase"
                    >
                      <PlusIcon className="h-4 w-4" />
                      From Scratch
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => setIsCreateOrderDialogOpen(true)}
                      className="text-muted-foreground flex gap-2 font-medium tracking-wide uppercase"
                    >
                      <ArrowPathRoundedSquareIcon className="h-4 w-4" />
                      From Existing Orders
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            <div className="no-scrollbar overflow-x-auto border rounded-lg divide-y dark:bg-zinc-950">
              <div className="flex gap-3 py-3 px-3">
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

              <div className="flex flex-col items-start bg-zinc-300/20 dark:bg-muted/10 px-3 py-2">
                <div className="flex flex-wrap gap-2 w-full items-center">
                  <PaginationNavigation
                    list={list}
                    total={data?.count || 0}
                    currentPage={currentPage}
                    pageSize={pageSize}
                  />
                  <PaginationDropdown
                    list={list}
                    total={data?.count || 0}
                    currentPage={currentPage}
                    pageSize={pageSize}
                  />
                  <SortSelection
                    list={list}
                    orderableFields={orderableFields}
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
                        <PlusIcon2
                          size={13}
                          className="stroke-muted-foreground"
                        />
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

              <StatusShopFilter statuses={statuses} orderCounts={orderCounts} />

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
            </div>

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
              // orders={Array(20)
              //   .fill()
              //   .flatMap(() => data?.items || [])}
              onProcessOrders={processSelectedOrders}
              processingOrders={processingOrders}
            />
          </main>
        ) : null
        // <LoadingIcon label="Loading item data" />
      }
    </>
  );
};

export default OrderPage;
