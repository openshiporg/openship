import React, { useState, useMemo, useEffect } from "react";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { Button } from "@ui/button";
import { Fields } from "@keystone/themes/Tailwind/atlas/components/Fields";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/atlas/components/GraphQLErrorNotice";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useQuery, gql, useApolloClient } from "@apollo/client";
import { X, ChevronDown } from "lucide-react";
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

import { getFilteredProps } from "../../shops/(components)/CreateShop";
import { LineItemSelect } from "../../shops/(components)/LineItemSelect";
import { CartItemSelect } from "../../shops/(components)/CartItemSelect";

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
  input: {
    label: "Shop Products",
    description: "Shop products in the match",
    fields: ["input"],
    component: "LineItemSelect",
  },
  output: {
    label: "Channel Products",
    description: "Channel products in the match",
    fields: ["output"],
    component: "CartItemSelect",
  },
};

const MatchDialog = DialogPrimitive.Root;
const MatchDialogTrigger = DialogPrimitive.Trigger;

const MatchDialogContent = React.forwardRef(
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
MatchDialogContent.displayName = DialogPrimitive.Content.displayName;

export function MatchDetailsDialog({ isOpen, onClose, match, shopId }) {
  const list = useList("Match");
  const client = useApolloClient();

  const { create, createWithData, props, state, error } = useCreateItem(list);
  const { createViewFieldModes } = useKeystone();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
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

  const handleSave = async () => {
    const formData = {};

    // Process lineItems
    if (localState.lineItems.length > 0) {
      formData.input = {
        create: localState.lineItems.map((item) => ({
          quantity: parseInt(item.quantity),
          productId: item.productId,
          variantId: item.variantId,
          shop: item.shop ? { connect: { id: item.shop.id } } : undefined,
        })),
      };
    }

    formData.output = {
      create: localState.cartItems.map((item) => ({
        price: item.price,
        quantity: parseInt(item.quantity),
        productId: item.productId,
        variantId: item.variantId,
        channel: item.channel
          ? { connect: { id: item.channel.id } }
          : undefined,
      })),
    };

    try {
      const item = await createWithData({ data: formData });
      if (item) {
        onClose();
        await client.refetchQueries({
          include: "active",
        });
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  useEffect(() => {
    if (match && !isInitialized) {
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

        if (match) {
          Object.keys(match).forEach((key) => {
            if (newValues[key] && key !== "shop") {
              newValues[key] = {
                ...oldValues[key],
                value: {
                  ...oldValues[key].value,
                  inner: {
                    ...oldValues[key].value.inner,
                    value: match[key],
                  },
                },
              };
            }
          });
        }

        return newValues;
      });
      setLocalState({
        lineItems: match.lineItems || [],
        cartItems: match.cartItems || [],
      });
      setIsInitialized(true);
    }
  }, [match, props, isInitialized]);

  return (
    <MatchDialog open={isOpen} onOpenChange={onClose}>
      <MatchDialogTrigger>
        <Button>Create Match</Button>
      </MatchDialogTrigger>
      <MatchDialogContent className="flex flex-col h-[90vh]">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Create Match</h2>
          <p className="text-gray-600">
            View and edit match information before creation
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
              {activeTab === "input" ? (
                <LineItemSelect
                  shops={shops}
                  localState={localState}
                  setLocalState={setLocalState}
                  shopId={shopId}
                />
              ) : activeTab === "output" ? (
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
                  //   {...props}
                />
              )}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end space-x-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={state === "loading"}
            onClick={handleSave}
          >
            Create Match
          </Button>
        </div>
      </MatchDialogContent>
    </MatchDialog>
  );
}
