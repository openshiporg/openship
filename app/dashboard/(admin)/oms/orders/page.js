"use client";
import React, { useState, useEffect, useMemo } from "react";
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
import { Link } from "next-view-transitions";
import { useToasts } from "@keystone/screens";
import { useDrawer } from "@keystone/themes/Tailwind/atlas/components/Modals/drawer-context";
import { OrderDetailsComponent } from "./(components)/OrderDetailsComponent";
import { StatusShopFilter } from "./(components)/StatusShopFilter";
import { ProcessOrdersDialog } from "./(components)/ProcessOrdersDialog";
import { OrderDetailsDialog } from "../shops/(components)/OrderDetailsDialog";
import { SearchOrders } from "../shops/(components)/SearchOrders";
import { CreateButtonLink } from "@keystone/themes/Tailwind/atlas/components/CreateButtonLink";
import { FilterAdd } from "@keystone/themes/Tailwind/atlas/components/FilterAdd";
import { FilterList } from "@keystone/themes/Tailwind/atlas/components/FilterList";
import { SortSelection } from "@keystone/themes/Tailwind/atlas/components/SortSelection";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import { LoadingIcon } from "@keystone/themes/Tailwind/atlas/components/LoadingIcon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/breadcrumb";
import {
  Pagination,
  PaginationDropdown,
  PaginationNavigation,
  PaginationStats,
} from "@keystone/themes/Tailwind/atlas/components/Pagination";
import { Input } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/input";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
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
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/tabs";
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
  query ORDERSCOUNT_QUERY($shopId: ID) {
    pendingCount: ordersCount(
      where: {
        status: { equals: "PENDING" }
        shop: { id: { equals: $shopId } }
      }
    )
    inprocessCount: ordersCount(
      where: {
        status: { equals: "INPROCESS" }
        shop: { id: { equals: $shopId } }
      }
    )
    awaitingCount: ordersCount(
      where: {
        status: { equals: "AWAITING" }
        shop: { id: { equals: $shopId } }
      }
    )
    backorderedCount: ordersCount(
      where: {
        status: { equals: "BACKORDERED" }
        shop: { id: { equals: $shopId } }
      }
    )
    cancelledCount: ordersCount(
      where: {
        status: { equals: "CANCELLED" }
        shop: { id: { equals: $shopId } }
      }
    )
    completeCount: ordersCount(
      where: {
        status: { equals: "COMPLETE" }
        shop: { id: { equals: $shopId } }
      }
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

  const selectedShop = searchParams.get("!shop_matches")?.replace(/^"|"$/g, "") || "ALL";

  const { data: orderCounts, refetch: refetchOrderCounts } = useQuery(
    ORDERSCOUNT_QUERY,
    {
      variables: {
        ...(selectedShop !== "ALL" ? { shopId: selectedShop } : {}),
      },
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    }
  );

  const statuses = [
    "PENDING",
    "INPROCESS",
    "AWAITING",
    "BACKORDERED",
    "CANCELLED",
    "COMPLETE",
  ];
  const { data: shopsData } = useQuery(ALL_SHOPS_QUERY);

  const shops = useMemo(() => {
    return shopsData?.shops || [];
  }, [shopsData]);

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

  let { data, error, refetch } = useQuery(
    useMemo(() => {
      let selectedGqlFields = `
        id
        orderId
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
        cartItems {
          id
          name
          image
          price
          quantity
          productId
          variantId
          purchaseId
          url
          error
          channel {
            id
            name
          }
        }
        lineItems {
          id
          name
          quantity
          price
          image
          productId
          variantId
        }
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
      `;

      return gql`
        query ($where: ${list.gqlNames.whereInputName}, $take: Int!, $skip: Int!, $orderBy: [${list.gqlNames.listOrderName}!]) {
          items: ${list.gqlNames.listQueryName}(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
            ${selectedGqlFields}
          }
          count: ${list.gqlNames.listQueryCountName}(where: $where)
        }
      `;
    }, [list]),
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

  const qualifyingOrdersCount = useMemo(() => {
    return (
      data?.items?.filter(
        (order) =>
          order.status === "PENDING" &&
          order.cartItems?.some((item) => !item.purchaseId)
      ).length || 0
    );
  }, [data]);

  return (
    <>
      {metaQuery.error ? (
        "Error..."
      ) : data && metaQuery.data ? (
        <main className="items-start gap-2 sm:py-0 md:gap-4">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{list.label}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex mt-2 mb-4">
            <div className="flex-col items-center">
              <h1 className="text-lg font-semibold md:text-2xl">
                {list.label}
              </h1>
              <p className="text-muted-foreground">
                {list.description ||
                  `Create and manage ${list.label.toLowerCase()}`}
              </p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleProcessAll}
                  disabled={qualifyingOrdersCount === 0}
                  className="h-9"
                >
                  Process Orders
                  <Badge className="ml-2 border py-0.5 px-1.5">
                    {qualifyingOrdersCount}
                  </Badge>
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

            <div className="flex gap-2 items-center bg-zinc-300/20 dark:bg-muted/10 px-3 py-2">
              <div>
                <PaginationNavigation
                  list={list}
                  total={data.count}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />
              </div>
              <div>
                <PaginationDropdown
                  list={list}
                  total={data.count}
                  currentPage={currentPage}
                  pageSize={pageSize}
                />
              </div>
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
                    <PlusIcon2 size={13} className="stroke-muted-foreground" />
                    FILTER
                  </button>
                }
              />
              {filters.filters.length ? (
                <>
                  <SquareArrowRight className="w-4 h-4 -mr-1 stroke-muted-foreground/60" />
                  <FilterList filters={filters.filters} list={list} />
                </>
              ) : null}
            </div>
            <div className="pb-1 pr-2 pl-3.5">
              <PaginationStats
                list={list}
                total={data.count}
                currentPage={currentPage}
                pageSize={pageSize}
              />
            </div>
            <StatusShopFilter
              statuses={statuses}
              shops={shops}
              orderCounts={orderCounts}
            />
            {data?.items?.length ? (
              <>
                <div className="grid grid-cols-1 divide-y">
                  {dataGetter.get("items").data.map((order) => (
                    <OrderDetailsComponent
                      key={order.id}
                      order={{
                        ...order,
                        date: new Date(order.createdAt).toLocaleString(),
                      }}
                      shopId={order.shop?.id}
                      onOrderAction={handleOrderAction}
                      openEditDrawer={openEditDrawer}
                      channels={channels}
                      loadingActions={loadingActions}
                    />
                  ))}
                </div>
              </>
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
                        variant="secondary"
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
            orders={data?.items || []}
            // orders={Array(20)
            //   .fill()
            //   .flatMap(() => data?.items || [])}
            onProcessOrders={processSelectedOrders}
            processingOrders={processingOrders}
          />
        </main>
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </>
  );
};

export default OrderPage;