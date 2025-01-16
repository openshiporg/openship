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
import { Fields } from "@keystone/themes/Tailwind/orion/components/Fields";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/orion/components/GraphQLErrorNotice";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Label } from "@ui/label";
import { channelAdapters as adapters } from "../../../../../channelAdapters";
import { getFilteredProps } from "./CreateChannel";
import { Badge } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";

export const channelAdapters = {
  ...adapters,
  Medusa: "soon",
  Magento: "soon",
  Stripe: "soon",
};

export function CreatePlatform({ refetch, trigger }) {
  const [selectedPlatform, setSelectedPlatform] = useState(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const list = useList("ChannelPlatform");
  const { create, props, state, error } = useCreateItem(list);
  const { createViewFieldModes } = useKeystone();

  const keysToUpdateCustom = [
    "name",
    "createPurchaseFunction",
    "getWebhooksFunction",
    "deleteWebhookFunction",
    "createWebhookFunction",
    "searchProductsFunction",
    "getProductFunction",
    "cancelPurchaseWebhookHandler",
    "createTrackingWebhookHandler",
    "oAuthFunction",
    "oAuthCallbackFunction",
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

    if (value === "custom") {
      clearFunctionFields();
    } else {
      props.onChange((oldValues) => {
        const newValues = { ...oldValues };
        keysToUpdateCustom
          .filter((key) => !["appKey", "appSecret"].includes(key))
          .forEach((key) => {
            newValues[key] = {
              ...oldValues[key],
              value: {
                ...oldValues[key].value,
                inner: {
                  ...oldValues[key].value.inner,
                  value:
                    key === "name"
                      ? value.charAt(0).toUpperCase() + value.slice(1)
                      : value,
                },
              },
            };
          });
        return newValues;
      });
    }
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

  const handleDialogClose = () => {
    setSelectedPlatform(null); // Reset selected platform
    clearFunctionFields(); // Clear all fields
    setIsDialogOpen(false); // Close dialog
  };

  const filteredProps = useMemo(() => {
    const fieldKeysToShow =
      selectedPlatform === "custom" ? keysToUpdateCustom : keysToUpdateTemplate;

    const modifications = fieldKeysToShow.map((key) => ({ key }));

    return getFilteredProps(props, [...modifications], true);
  }, [props, selectedPlatform]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel Platform</DialogTitle>
          <DialogDescription>
            {selectedPlatform === "custom"
              ? "Create a custom platform from scratch by providing the necessary fields"
              : "Create a platform based on an existing template"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-base pb-2">Platform</Label>
          <Select
            onValueChange={handleTemplateSelection}
            value={selectedPlatform}
          >
            <SelectTrigger className="w-full bg-muted/40 text-base">
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="-ml-6">Templates</SelectLabel>
                {Object.keys(channelAdapters).map((key) => (
                  <SelectItem
                    key={key}
                    value={key}
                    disabled={channelAdapters[key] === "soon"}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="-ml-6">Custom</SelectLabel>
                <SelectItem value="custom">Start from scratch...</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {selectedPlatform && (
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
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDialogClose} // Clear fields and close dialog
          >
            Cancel
          </Button>
          <Button
            isLoading={state === "loading"}
            disabled={!selectedPlatform}
            onClick={handlePlatformActivation}
          >
            Create Platform
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
