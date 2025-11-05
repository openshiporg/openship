"use client";
import React, { useMemo, useState } from "react";
import { useList } from "@/features/dashboard/hooks/useAdminMeta";
import { useCreateItem } from "@/features/dashboard/utils/useCreateItem";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Fields } from "@/features/dashboard/components/Fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// TODO: Import from actual shop adapters when available
const shopAdapters = {
  shopify: "shopify",
  openfront: "openfront",
  demo: "demo",
};

export function getFilteredProps(props: any, modifications: any[], defaultCollapse?: boolean) {
  if (!props || !props.fields) return props;

  const fieldKeysToShow = modifications.map((mod) => mod.key);
  const breakGroups = modifications.reduce((acc: string[], mod) => {
    if (mod.breakGroup) {
      acc.push(mod.breakGroup);
    }
    return acc;
  }, []);

  // Filter fields to only show the ones we want
  const filteredFields = Object.keys(props.fields).reduce((obj: any, key) => {
    if (fieldKeysToShow.includes(key)) {
      const modification = modifications.find((mod) => mod.key === key);
      if (modification) {
        obj[key] = {
          ...props.fields[key],
          fieldMeta: {
            ...props.fields[key].fieldMeta,
            ...modification.fieldMeta,
          },
        };
      } else {
        obj[key] = props.fields[key];
      }
    }
    return obj;
  }, {});

  // Reorder fields according to modifications order
  const reorderedFields = modifications.reduce((obj: any, mod) => {
    if (filteredFields[mod.key]) {
      obj[mod.key] = filteredFields[mod.key];
    }
    return obj;
  }, {});

  // Update groups if they exist
  const updatedGroups = props.groups ? props.groups.map((group: any) => {
    if (breakGroups.includes(group.label)) {
      return {
        ...group,
        fields: group.fields.filter(
          (field: any) => !fieldKeysToShow.includes(field.path)
        ),
      };
    }
    return {
      ...group,
      collapsed: defaultCollapse,
    };
  }) : [];

  return {
    ...props,
    fields: reorderedFields,
    groups: updatedGroups,
  };
}

export function CreatePlatform({ trigger }: { trigger: React.ReactNode }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { list } = useList('ShopPlatform');

  // Create enhanced fields like Keystone does - same pattern as CreatePageClient
  const enhancedFields = useMemo(() => {
    if (!list?.fields) return {}
    return enhanceFields(list.fields, list.key)
  }, [list?.fields, list?.key])

  // Use the create item hook with enhanced fields
  const createItem = useCreateItem(list, enhancedFields);

  const keysToUpdateCustom = [
    "name",
    "orderLinkFunction",
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
    if (!createItem) return

    const item = await createItem.create()
    if (item?.id) {
      setIsDialogOpen(false);
      // Refresh the page to show the new platform
      await queryClient.invalidateQueries({
        queryKey: ['lists', 'ShopPlatform', 'items']
      });
    }
  };

  const handleTemplateSelection = (value: string) => {
    setSelectedPlatform(value);
    
    // Pre-fill function fields with template slug when a template is selected
    if (value !== "custom" && createItem) {
      const currentValue = createItem.props.value;
      
      // Auto-fill name field for demo
      let nameValue = currentValue.name;
      if (value === "demo") {
        nameValue = { kind: 'create' as const, inner: { kind: 'value' as const, value: "Demo Shop" } };
      }
      
      let functionValues;
      if (value === "demo") {
        // Use localhost docs API routes for demo
        functionValues = {
          searchProductsFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/search-products' } },
          getProductFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/get-product' } },
          searchOrdersFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/search-orders' } },
          updateProductFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/update-product' } },
          orderLinkFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/order-link' } },
          getWebhooksFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/get-webhooks' } },
          deleteWebhookFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/delete-webhook' } },
          createWebhookFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/create-webhook' } },
          addTrackingFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/add-tracking' } },
          addCartToPlatformOrderFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/add-cart-to-order' } },
          oAuthFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/oauth' } },
          oAuthCallbackFunction: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/oauth-callback' } },
          cancelOrderWebhookHandler: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/webhook-cancel-order' } },
          createOrderWebhookHandler: { kind: 'create' as const, inner: { kind: 'value' as const, value: 'http://localhost:3000/api/demo/shop/webhook-create-order' } },
        };
      } else {
        // Use template slug for other platforms (shopify, etc.)
        const templateValue = { kind: 'create' as const, inner: { kind: 'value' as const, value: value } };
        const emptyValue = { kind: 'create' as const, inner: { kind: 'value' as const, value: "" } };
        
        functionValues = {
          orderLinkFunction: templateValue,
          updateProductFunction: templateValue, 
          getWebhooksFunction: templateValue,
          deleteWebhookFunction: templateValue,
          createWebhookFunction: templateValue,
          searchProductsFunction: templateValue,
          getProductFunction: templateValue,
          searchOrdersFunction: templateValue,
          addTrackingFunction: templateValue,
          addCartToPlatformOrderFunction: templateValue,
          // Leave OAuth functions empty for Shopify since users likely don't have app keys yet
          oAuthFunction: value === 'shopify' ? emptyValue : templateValue,
          oAuthCallbackFunction: value === 'shopify' ? emptyValue : templateValue,
          cancelOrderWebhookHandler: templateValue,
          createOrderWebhookHandler: templateValue,
        };
      }
      
      const newValue = {
        ...currentValue,
        name: nameValue,
        ...functionValues,
      };
      createItem.props.onChange(newValue);
    }
  };

  const handleDialogClose = () => {
    setSelectedPlatform(undefined);
    setIsDialogOpen(false);
  };

  const filteredProps = useMemo(() => {
    if (!createItem) return null

    let fieldKeysToShow;
    if (selectedPlatform === "custom") {
      fieldKeysToShow = keysToUpdateCustom;
    } else if (selectedPlatform === "demo") {
      fieldKeysToShow = ["name"]; // Only show name field for demo
    } else {
      fieldKeysToShow = keysToUpdateTemplate;
    }

    const modifications = fieldKeysToShow.map((key) => ({ key }));

    return getFilteredProps(createItem.props, [...modifications], true);
  }, [createItem?.props, selectedPlatform]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shop Platform</DialogTitle>
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
                {Object.keys(shopAdapters).map((key) => (
                  <SelectItem
                    key={key}
                    value={key}
                    disabled={shopAdapters[key as keyof typeof shopAdapters] === "soon"}
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
            {createItem?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {createItem.error.networkError?.message ||
                   createItem.error.graphQLErrors?.[0]?.message ||
                   'An error occurred while creating the platform'
                  }
                </AlertDescription>
              </Alert>
            )}
            <Fields {...filteredProps} />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDialogClose}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedPlatform || createItem?.state === "loading"}
            onClick={handlePlatformActivation}
          >
            {createItem?.state === "loading" ? "Creating..." : "Create Platform"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}