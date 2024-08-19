"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState, useEffect, useCallback } from "react";
import {
  gql,
  useApolloClient,
  useMutation,
  useQuery,
} from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useQueryParamsFromLocalStorage } from "@keystone/utils/useQueryParamsFromLocalStorage";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Circle,
  Columns3,
  PlusIcon,
  Search,
  Square,
  SquareArrowRight,
  Triangle,
  ChevronsUpDown,
  MoreHorizontal,
  ArrowRight,
  MoreVertical,
  GlobeIcon,
  SaveIcon,
} from "lucide-react";
import { Link } from "next-view-transitions";

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
// import { OrderDetailsComponent } from "../shops/(components)/SearchOrders";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/accordion";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/dropdown-menu";
import {
  Cog6ToothIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
  TicketIcon,
  ArrowPathIcon,
  CircleStackIcon,
  Square3Stack3DIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useDrawer } from "@keystone/themes/Tailwind/atlas/components/Modals/drawer-context";
import ListTable from "@keystone/themes/Tailwind/atlas/components/ListTable";

const PLACE_ORDERS = gql`
  mutation PLACE_ORDERS($ids: [ID!]!) {
    placeOrders(ids: $ids) {
      orderId
    }
  }
`;

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

const ALL_SHOPS_QUERY = gql`
  query ALL_SHOPS_QUERY {
    shops {
      id
      name
    }
  }
`;

const ORDERSCOUNT_QUERY = gql`
  query ORDERSCOUNT_QUERY($where: OrderWhereInput!) {
    ordersCount(where: $where)
  }
`;
const StatusBadge = ({ status, selectedStatus, selectedShop, onClick }) => {
  const { data, loading } = useQuery(ORDERSCOUNT_QUERY, {
    variables: {
      where: {
        status: { equals: status },
        ...(selectedShop !== "ALL"
          ? { shop: { id: { equals: selectedShop } } }
          : {}),
      },
    },
  });

  return (
    <Badge
      color={selectedStatus === status ? "sky" : "zinc"}
      className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
        selectedStatus === status ? "opacity-100" : "opacity-70"
      }`}
      onClick={() => onClick(status)}
    >
      {status} ({loading ? "..." : data?.ordersCount || 0})
    </Badge>
  );
};

const StatusShopFilter = ({ statuses, shops }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedStatus = searchParams
    .get("!status_is_i")
    ?.replace(/^"|"$/g, "");
  const selectedShop =
    searchParams.get("!shop_matches")?.replace(/^"|"$/g, "") || "ALL";

  const shopWhere =
    selectedShop !== "ALL" ? { shop: { id: { equals: selectedShop } } } : {};

  const { data: orderCounts } = useQuery(ORDERSCOUNT_QUERY, {
    variables: {
      where: {
        status: { equals: "AWAITING" },
        shop: { id: { in: ["clx7lhcg300035m37ch0ot6jh"] } },
      },
    },
  });

  const statusCounts = useMemo(() => {
    if (!orderCounts) return {};
    return statuses.reduce((acc, status, index) => {
      acc[status] = orderCounts.ordersCount[index];
      return acc;
    }, {});
  }, [orderCounts, statuses]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (!params.get("!status_is_i")) {
      params.set("!status_is_i", `"PENDING"`);
      router.push(`${pathname}?${params.toString()}`, { shallow: true });
    }
  }, []);

  const handleStatusChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status === selectedStatus) {
      params.delete("!status_is_i");
    } else {
      params.set("!status_is_i", `"${status}"`);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleShopChange = (shopId) => {
    const params = new URLSearchParams(searchParams);
    if (shopId !== "ALL") {
      params.set("!shop_matches", `"${shopId}"`);
    } else {
      params.delete("!shop_matches");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2 divide-y">
      <div className="p-2">
        <h2 className="text-xs font-normal mb-2 text-muted-foreground">
          Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <StatusBadge
              key={status}
              status={status}
              selectedStatus={selectedStatus}
              selectedShop={selectedShop}
              onClick={handleStatusChange}
            />
          ))}
        </div>
      </div>
      <div className="p-2">
        <h2 className="text-xs font-normal mb-2 text-muted-foreground">
          Shops
        </h2>
        <div className="flex flex-wrap gap-2">
          {shops.map((shop) => (
            <Badge
              key={shop.id}
              color={selectedShop === shop.id ? "sky" : "zinc"}
              className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
                selectedShop === shop.id ? "opacity-100" : "opacity-70"
              }`}
              onClick={() => handleShopChange(shop.id)}
            >
              {shop.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export const OrderDetailsComponent = ({
  order,
  shopId,
  onOrderAction,
  openEditDrawer,
}) => {
  const orderButtons = [
    {
      buttonText: "GET MATCH",
      color: "green",
      icon: <Square2StackIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("getMatch", order.id),
    },
    {
      buttonText: "SAVE MATCH",
      color: "teal",
      icon: <SaveIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("saveMatch", order.id),
    },
    {
      buttonText: "PLACE ORDER",
      color: "cyan",
      icon: <TicketIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("placeOrder", order.id),
    },
    {
      buttonText: "EDIT ORDER",
      color: "blue",
      icon: <PencilSquareIcon className="w-4 h-4" />,
      onClick: () => openEditDrawer(order.id, "Order"),
    },
    {
      buttonText: "DELETE ORDER",
      color: "red",
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("deleteOrder", order.id),
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.orderId} className="border-0">
        <div className="px-4 py-2 flex items-start justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <span className="uppercase font-medium text-sm">
                {order.orderName}
              </span>
              <span className="text-xs font-medium opacity-65">
                {order.date}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {order.shop.name}
              </span>
            </div>
            <div className="text-sm opacity-75">
              <p>
                {order.firstName} {order.lastName}
              </p>
              <p>{order.streetAddress1}</p>
              {order.streetAddress2 && <p>{order.streetAddress2}</p>}
              <p>
                {order.city}, {order.state} {order.zip}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dropdown>
              <DropdownButton
                // as={BadgeButton}
                variant="secondary"
                className="border p-1"
              >
                <MoreVertical className="h-3 w-3" />
              </DropdownButton>
              <DropdownMenu anchor="bottom end">
                {orderButtons.map((button) => (
                  <DropdownItem
                    key={button.buttonText}
                    onClick={button.onClick}
                    className="text-muted-foreground flex gap-2 font-medium tracking-wide"
                  >
                    <span>{button.icon}</span>
                    {button.buttonText}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <AccordionTrigger hideArrow className="py-0">
              <BadgeButton color="zinc" className="border p-1">
                <ChevronDown className="h-3 w-3" />
              </BadgeButton>
            </AccordionTrigger>
          </div>
        </div>
        <AccordionContent>
          <div className="divide-y">
            <ProductDetailsCollapsible
              items={order.lineItems}
              title="Line Item"
              defaultOpen={true}
              openEditDrawer={openEditDrawer}
            />
            {order.cartItems && order.cartItems.length > 0 && (
              <ProductDetailsCollapsible
                items={order.cartItems}
                title="Cart Item"
                defaultOpen={true}
                openEditDrawer={openEditDrawer}
              />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ProductDetailsCollapsible = ({
  items,
  title,
  defaultOpen = true,
  openEditDrawer,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isCartItem = title === "Cart Item";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col gap-2 p-3 ${
        isCartItem
          ? "bg-green-50/40 dark:bg-emerald-900/20"
          : "bg-blue-50/30 dark:bg-indigo-900/10"
      }`}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
            isCartItem
              ? "text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
              : "text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
          }`}
        >
          {items.length} {title}
          {items.length > 1 && "s"}
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item, index) => (
          <div key={item.lineItemId + "-details-" + index}>
            <div className="border p-2 bg-background rounded-sm flex items-center gap-4">
              <img
                className="border rounded-sm h-12 w-12 object-cover"
                src={item.image}
                alt={item.name}
              />
              <div className="grid flex-grow">
                <div className="uppercase font-medium tracking-wide text-xs text-muted-foreground">
                  {item.channel?.name}
                </div>
                <span className="text-sm font-medium">{item.name}</span>
                <div className="text-xs text-muted-foreground">
                  {item.productId} | {item.variantId}
                </div>
                {item.quantity > 1 ? (
                  <div className="flex gap-2 items-center">
                    <p className="text-sm dark:text-emerald-500 font-medium">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      (${parseFloat(item.price).toFixed(2)} x {item.quantity})
                    </p>
                  </div>
                ) : (
                  <p className="text-sm dark:text-emerald-500 font-medium">
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 self-end">
                {isCartItem && (
                  <Button className="text-xs h-6 px-2">
                    ORDER <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="p-1"
                  onClick={() =>
                    openEditDrawer(
                      item.id,
                      isCartItem ? "CartItem" : "LineItem"
                    )
                  }
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const OrderPage = () => {
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
    return [{ id: "ALL", name: "All Shops" }, ...(shopsData?.shops || [])];
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

  const handleOrderAction = async (action, orderId) => {
    switch (action) {
      case "getMatch":
        console.log("Getting match for order:", orderId);
        break;
      case "saveMatch":
        console.log("Saving match for order:", orderId);
        break;
      case "placeOrder":
        try {
          await placeOrders({ variables: { ids: [orderId] } });
          await refetch();
          console.log("Order placed successfully:", orderId);
        } catch (error) {
          console.error("Error placing order:", error);
        }
        break;
      case "editOrder":
        openEditDrawer(orderId, "Order");
        break;
      case "deleteOrder":
        console.log("Deleting order:", orderId);
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

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
            {data.count || query.search || filters.filters.length ? (
              <div className="ml-auto">
                {showCreate && <CreateButtonLink list={list} />}
              </div>
            ) : null}
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
                    <PlusIcon size={13} className="stroke-muted-foreground" />
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
            <StatusShopFilter statuses={statuses} shops={shops} />
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
                      shopId={order.shop.id}
                      onOrderAction={handleOrderAction}
                      openEditDrawer={openEditDrawer}
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
                          const { search, ...queries } = query;
                          const newQueryString = new URLSearchParams(
                            queries
                          ).toString();
                          push(`?${newQueryString}`);
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
        </main>
      ) : (
        <LoadingIcon label="Loading item data" />
      )}
    </>
  );
};

export default OrderPage;
