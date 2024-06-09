"use client";
import React, { useMemo, useState } from "react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { Button } from "@ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/dialog";
import { Fields } from "@keystone/themes/Tailwind/atlas/components/Fields";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/atlas/components/GraphQLErrorNotice";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@ui/tabs";
import { Label } from "@ui/label";
import { shopFunctions } from "../../../../../../shopFunctions";
import { BadgeButton } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Plus } from "lucide-react";
import { getFilteredProps } from "./CreateShop";

export const mockShopFunctions = {
  ...shopFunctions,
  Webflow: () => import("../../../../../../shopFunctions/shopify"),
  WiX: () => import("../../../../../../shopFunctions/bigcommerce"),
  Medusa: () => import("../../../../../../shopFunctions/woocommerce"),
  Openfront: () => import("../../../../../../shopFunctions/shopify"),
  Stripe: () => import("../../../../../../shopFunctions/bigcommerce"),
};

export function CreatePlatform({ refetch, trigger }) {
  const [selectedTab, setSelectedTab] = useState("template");
  const [selectedPlatform, setSelectedPlatform] = useState(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const list = useList("ShopPlatform");
  const { create, props, state, error } = useCreateItem(list);
  const { createViewFieldModes } = useKeystone();

  const keysToUpdateCustom = [
    "name",
    "updateProductFunction",
    "getWebhooksFunction",
    "deleteWebhookFunction",
    "createWebhookFunction",
    "searchProductsFunction",
    "getProductFunction",
    "searchOrdersFunction",
    "addTrackingFunction",
    "addCartToPlatformOrderFunction",
    "oAuthFunction",
    "oAuthCallbackFunction",
    "cancelOrderWebhookHandler",
    "createOrderWebhookHandler",
    "appKey",
    "appSecret",
  ];

  const keysToUpdateTemplate = ["name", "appKey", "appSecret"];

  const handlePlatformActivation = async () => {
    const item = await create();
    if (item) {
      refetch();
      clearFunctionFields();
      setIsDialogOpen(false);
    }
  };

  const handleTemplateSelection = (value) => {
    setSelectedPlatform(value);

    props.onChange((oldValues) => {
      const newValues = { ...oldValues };
      keysToUpdateCustom
        .filter((key) => !["name", "appKey", "appSecret"].includes(key))
        .forEach((key) => {
          newValues[key] = {
            ...oldValues[key],
            value: {
              ...oldValues[key].value,
              inner: {
                ...oldValues[key].value.inner,
                value: value,
              },
            },
          };
        });
      return newValues;
    });
  };

  const clearFunctionFields = () => {
    const clearedFields = keysToUpdateCustom.reduce((acc, key) => {
      acc[key] = {
        ...props.value[key],
        value: {
          ...props.value[key].value,
          inner: {
            ...props.value[key].value.inner,
            value: "",
          },
        },
      };
      return acc;
    }, {});

    props.onChange((prev) => ({ ...prev, ...clearedFields }));
  };

  const handleTabChange = (value) => {
    setSelectedTab(value);
    if (value === "custom") {
      clearFunctionFields();
    }
  };

  const handleDialogClose = () => {
    setSelectedPlatform(null); // Reset selected platform
    clearFunctionFields(); // Clear all fields
    setIsDialogOpen(false); // Close dialog
  };

  const filteredProps = useMemo(() => {
    const fieldKeysToShow =
      selectedTab === "custom" ? keysToUpdateCustom : keysToUpdateTemplate;

    const modifications = fieldKeysToShow.map((key) => ({ key }));

    return getFilteredProps(props, modifications);
  }, [props, selectedTab]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shop Platform</DialogTitle>
          <DialogDescription>
            {selectedTab === "custom"
              ? "Create a custom platform from scratch by providing the necessary fields"
              : "Create a platform based on an existing template"}
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={selectedTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="template">
            <div className="mb-4 space-y-2">
              <Label className="text-base pb-2">Template</Label>
              <Select
                onValueChange={handleTemplateSelection}
                value={selectedPlatform}
              >
                <SelectTrigger className="w-full bg-muted/40 text-base">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(mockShopFunctions).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlatform && (
              <div className="bg-muted/20 p-4 border rounded-lg overflow-auto max-h-[50vh]">
                <Fields {...filteredProps} />
              </div>
            )}
          </TabsContent>
          <TabsContent value="custom">
            <div className="bg-muted/20 p-4 border rounded-lg overflow-auto max-h-[50vh]">
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
                <div label="Loading create form" />
              )}
              <Fields {...filteredProps} />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            variant="light"
            onClick={handleDialogClose} // Clear fields and close dialog
          >
            Cancel
          </Button>
          <Button
            isLoading={state === "loading"}
            disabled={!selectedPlatform && !selectedTab === "custom"}
            onClick={handlePlatformActivation}
          >
            {selectedTab === "custom" ? "Create Platform" : "Activate Platform"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
