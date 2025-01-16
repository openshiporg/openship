import React, { useState, useMemo, useEffect, useRef } from "react";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { Button } from "@ui/button";
import { Fields } from "@keystone/themes/Tailwind/orion/components/Fields";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/orion/components/GraphQLErrorNotice";
import { getFilteredProps } from "./CreateShop";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useQuery, gql, useApolloClient } from "@apollo/client";
import {
  ChevronDownIcon,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@keystone/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";

import { LineItemSelect } from "./LineItemSelect";
import { CartItemSelect } from "./CartItemSelect";

const SHOPS_QUERY = gql`
  query GetShops {
    shops {
      id
      name
    }
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

const SECTIONS = {
  orderDetails: {
    label: "Order Details",
    description: "Basic order information and status",
    fields: [
      "orderId",
      "orderName",
      "shop",
      "status",
      "currency",
      "totalPrice",
      "subTotalPrice",
      "totalDiscount",
      "totalTax",
      "shippingMethod",
    ],
  },
  customerInfo: {
    label: "Customer Info",
    description: "Customer contact details",
    fields: ["email", "firstName", "lastName", "phoneNumber"],
  },
  shippingAddress: {
    label: "Shipping Address",
    description: "Delivery location information",
    fields: [
      "streetAddress1",
      "streetAddress2",
      "city",
      "state",
      "zip",
      "country",
    ],
  },
  additionalInfo: {
    label: "Additional Info",
    description: "Extra details and order notes",
    fields: ["note", "orderError", "locationId"],
  },
  lineItems: {
    label: "Line Items",
    description: "Individual products in the order",
    fields: ["lineItems"],
    component: "LineItemSelect",
  },
  cartItems: {
    label: "Cart Items",
    description: "Items in the customer's cart",
    fields: ["cartItems"],
    component: "CartItemSelect",
  },
  orderActions: {
    label: "Order Actions",
    description: "Manage and process the order",
    fields: ["linkOrder", "matchOrder", "processOrder"],
  },
};

const OrderDialog = DialogPrimitive.Root;
const OrderDialogTrigger = DialogPrimitive.Trigger;

const OrderDialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "dark:border fixed left-[50%] top-[50%] z-50 w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] rounded-lg bg-background shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
OrderDialogContent.displayName = DialogPrimitive.Content.displayName;

export function OrderDetailsDialog({ isOpen, onClose, order, shopId }) {
  const list = useList("Order");
  const client = useApolloClient();

  const { create, createWithData, props, state, error } = useCreateItem(list);
  const { createViewFieldModes } = useKeystone();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [localState, setLocalState] = useState({
    lineItems: [],
    cartItems: [],
  });

  const { data: shopsData } = useQuery(SHOPS_QUERY);
  const { data: channelsData } = useQuery(CHANNELS_QUERY);

  const shops = shopsData?.shops || [];
  const channels = channelsData?.channels || [];

  const filteredProps = useMemo(() => {
    const modifications = Object.values(SECTIONS)
      .flatMap((section) => section.fields)
      .map((key) => ({ key }));
    return getFilteredProps(props, modifications, true);
  }, [props]);

  const filterValidCartItems = (cartItems) => {
    return cartItems.filter((item) =>
      channels.some((channel) => channel.id === item.channel?.id)
    );
  };

  const handleSave = async () => {
    const formData = {};

    // Process props.value
    Object.entries(props.value).forEach(([key, value]) => {
      if (
        value.value?.inner?.value !== null &&
        value.value?.inner?.value !== "" &&
        value.value?.inner?.value !== undefined
      ) {
        formData[key] = value.value.inner.value;
      }
    });

    // Special handling for shop
    if (props.value.shop?.value?.value?.id) {
      formData.shop = { connect: { id: props.value.shop.value.value.id } };
    }

    // Process lineItems
    if (localState.lineItems.length > 0) {
      formData.lineItems = {
        create: localState.lineItems.map((item) => ({
          name: item.title || item.name,
          image: item.image,
          price: item.price,
          quantity: parseInt(item.quantity),
          productId: item.productId,
          variantId: item.variantId,
          lineItemId: item.lineItemId,
        })),
      };
    }

    // Process cartItems
    const validCartItems = localState.cartItems.filter((item) =>
      channels.some((channel) => channel.id === item.channel?.id)
    );

    if (validCartItems.length > 0) {
      formData.cartItems = {
        create: validCartItems.map((item) => ({
          name: item.title || item.name,
          image: item.image,
          price: item.price,
          quantity: parseInt(item.quantity),
          productId: item.productId,
          variantId: item.variantId,
          channel: item.channel
            ? { connect: { id: item.channel.id } }
            : undefined,
        })),
      };
    } else {
      // If there are no valid cart items, ensure cartItems is not included in formData
      delete formData.cartItems;
    }

    // Connect the shop
    // if (shopId) {
    //   formData.shop = { connect: { id: shopId } };
    // }

    try {
      const item = await createWithData({ data: formData });
      if (item) {
        onClose();
        // await client.refetchQueries({
        //   include: "active",
        // });
        await client.refetchQueries({
          include: "active",
         
        });
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  useEffect(() => {
    if (order && !isInitialized) {
      props.onChange((oldValues) => {
        const newValues = { ...oldValues };

        // Set shop value first
        if (shopId && newValues.shop) {
          newValues.shop = {
            ...oldValues.shop,
            kind: "value",
            value: {
              id: null,
              kind: "one",
              value: {
                id: shopId,
                label: shops.find((shop) => shop.id === shopId)?.name || "",
                data: { __typename: "Shop" },
              },
              initialValue: null,
            },
          };
        }

        if (order) {
          Object.keys(order).forEach((key) => {
            if (newValues[key] && key !== "shop") {
              newValues[key] = {
                ...oldValues[key],
                value: {
                  ...oldValues[key].value,
                  inner: {
                    ...oldValues[key].value.inner,
                    value: order[key],
                  },
                },
              };
            }
          });
        }
        // Ensure status is set to PENDING
        newValues.status = {
          ...oldValues.status,
          value: {
            ...oldValues.status?.value,
            inner: {
              ...oldValues.status?.value?.inner,
              value: "PENDING",
            },
          },
        };

        return newValues;
      });
      setLocalState({
        lineItems: order.lineItems || [],
        cartItems: order.cartItems || [],
      });
      setIsInitialized(true);
    }
  }, [order, props, isInitialized]);

  return (
    <OrderDialog open={isOpen} onOpenChange={onClose}>
      <OrderDialogContent className="flex flex-col h-[90vh]">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Create Order</h2>
          <p className="text-gray-600">
            View and edit order information before creation
          </p>
        </div>
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden p-4 md:p-0 w-full">
          {/* Mobile dropdown */}
          <div className="md:hidden w-full mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectPrimitive.Trigger
                className={cn(
                  "flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <div className="text-left">
                  <div className="font-medium">{SECTIONS[activeTab].label}</div>
                  <div className="text-sm text-gray-600">
                    {SECTIONS[activeTab].description}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectPrimitive.Trigger>
              <SelectContent>
                {Object.entries(SECTIONS).map(
                  ([key, { label, description }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-600">{description}</div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Desktop sidebar */}
          <div className="hidden md:block w-64 border-r overflow-y-auto flex-shrink-0">
            {Object.entries(SECTIONS).map(([key, { label, description }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "w-full text-left p-4 focus:outline-none",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "group transition-colors duration-200",
                  activeTab === key
                    ? "bg-blue-50 group-hover:bg-blue-500/25 dark:bg-blue-500/10 dark:group-hover:bg-blue-500/25 border-l-4 border-blue-500 dark:border-blue-800/50"
                    : ""
                )}
              >
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-500">
                  {description}
                </div>
              </button>
            ))}
          </div>
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="md:p-6 overflow-y-auto flex-grow">
              {error && (
                <GraphQLErrorNotice
                  networkError={error?.networkError}
                  errors={error?.graphQLErrors}
                />
              )}
              {createViewFieldModes.state === "error" && (
                <GraphQLErrorNotice
                  networkError={
                    createViewFieldModes.error instanceof Error
                      ? createViewFieldModes.error
                      : undefined
                  }
                  errors={
                    createViewFieldModes.error instanceof Error
                      ? undefined
                      : createViewFieldModes.error
                  }
                />
              )}
              {createViewFieldModes.state === "loading" && (
                <div className="text-center py-4">Loading update form...</div>
              )}
              {/* {JSON.stringify(props.value.shop)} */}
              {activeTab === "lineItems" ? (
                <LineItemSelect
                  shops={shops}
                  localState={localState}
                  setLocalState={setLocalState}
                  shopId={shopId}
                />
              ) : activeTab === "cartItems" ? (
                <CartItemSelect
                  channels={channels}
                  localState={localState}
                  setLocalState={setLocalState}
                />
              ) : (
                <Fields
                  {...getFilteredProps(
                    filteredProps,
                    SECTIONS[activeTab].fields.map((key) => ({ key })),
                    true
                  )}
                />
              )}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            isLoading={state === "loading"}
            onClick={handleSave}
          >
            Create Order
          </Button>
        </div>
      </OrderDialogContent>
    </OrderDialog>
  );
}
