import React, { useState } from "react";
import { useMutation, gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { useToasts } from "@keystone/screens";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/tooltip";
import { RiLoader2Fill } from "@remixicon/react";
import { Plus } from "lucide-react";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/orion/components/GraphQLErrorNotice";

const CREATE_SHOP_WEBHOOK = gql`
  mutation CreateShopWebhook(
    $shopId: ID!
    $topic: String!
    $endpoint: String!
  ) {
    createShopWebhook(shopId: $shopId, topic: $topic, endpoint: $endpoint) {
      success
      error
      webhookId
    }
  }
`;

const DELETE_SHOP_WEBHOOK = gql`
  mutation DeleteShopWebhook($shopId: ID!, $webhookId: ID!) {
    deleteShopWebhook(shopId: $shopId, webhookId: $webhookId) {
      success
      error
    }
  }
`;

const GET_SHOP_WEBHOOKS = gql`
  query GetShopWebhooks($shopId: ID!) {
    getShopWebhooks(shopId: $shopId) {
      id
      callbackUrl
      topic
    }
  }
`;

const RECOMMENDED_WEBHOOKS = [
  {
    callbackUrl: "/api/handlers/shop/create-order/[shopId]",
    topic: "ORDER_CREATED",
    description:
      "When an order is created on this shop, Openship will create the order to be fulfilled.",
  },
  {
    callbackUrl: "/api/handlers/shop/cancel-order/[shopId]",
    topic: "ORDER_CANCELLED",
    description:
      "When an order is cancelled on this shop, Openship will mark the order status cancelled",
  },
  {
    callbackUrl: "/api/handlers/shop/cancel-order/[shopId]",
    topic: "ORDER_CHARGEBACKED",
    description:
      "When an order is chargebacked on this shop, Openship will mark the order status cancelled",
  },
];

const WebhookItem = ({ webhook, refetch, shopId }) => {
  const [deleteWebhook] = useMutation(DELETE_SHOP_WEBHOOK);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteWebhook({
      variables: {
        shopId,
        webhookId: webhook.id,
      },
    })
      .then(({ errors }) => {
        const error = errors?.find(
          (x) => x.path === undefined || x.path?.length === 1
        );
        if (error) {
          toasts.addToast({
            title: "Failed to delete webhook",
            tone: "negative",
            message: error.message,
          });
        } else {
          toasts.addToast({
            tone: "positive",
            title: "Webhook deleted successfully",
          });
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to delete webhook",
          tone: "negative",
          message: err.message,
        });
      });
    refetch();
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{webhook.topic}</span>
        <BadgeButton
          color="red"
          className="text-[.6rem] uppercase tracking-wide py-0 px-1 border"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </BadgeButton>
      </div>
      <div className="flex flex-col gap-0.5 bg-background border mb-2 p-2 rounded-lg text-xs text-muted-foreground">
        <span className="opacity-90 font-medium">Callback URL:</span>
        {webhook.callbackUrl}
      </div>
    </div>
  );
};

const RecommendedWebhookItem = ({ webhook, refetch, shopId }) => {
  const [createWebhook, { loading, error }] = useMutation(CREATE_SHOP_WEBHOOK);
  const toasts = useToasts();

  const handleCreate = async () => {
    await createWebhook({
      variables: {
        shopId,
        topic: webhook.topic,
        endpoint: webhook.callbackUrl.replace("[shopId]", shopId),
      },
    })
      .then(({ errors }) => {
        const error = errors?.find(
          (x) => x.path === undefined || x.path?.length === 1
        );
        if (error) {
          toasts.addToast({
            title: "Failed to create webhook",
            tone: "negative",
            message: error.message,
          });
        } else {
          toasts.addToast({
            tone: "positive",
            title: "Webhook created successfully",
          });
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to create webhook",
          tone: "negative",
          message: err.message,
        });
      });
    refetch();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          
          <Button
            variant="secondary"
            size="icon"
            className="border [&_svg]:size-2.5 h-5 w-5"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? <RiLoader2Fill className="animate-spin" /> : <Plus />}
          </Button>
          <span className="text-xs font-medium">{webhook.topic}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="text-muted-foreground size-3" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64">
                <p>{webhook.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export const Webhooks = ({ shopId }) => {
  const { data, loading, error, refetch } = useQuery(GET_SHOP_WEBHOOKS, {
    variables: { shopId },
  });

  if (loading) {
    return <div>Loading webhooks...</div>;
  }

  if (error) {
    return (
      <div>
        <Badge color="rose" className="border opacity-80 text-sm w-full">
          Error loading webhooks: {error?.message}
        </Badge>
      </div>
    );
  }

  const webhooks = data.getShopWebhooks;

  return (
    <div className="max-w-80">
      <div className="flex flex-col gap-2">
        {webhooks.map((webhook) => (
          <WebhookItem
            key={webhook.id}
            webhook={webhook}
            refetch={refetch}
            shopId={shopId}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {RECOMMENDED_WEBHOOKS.map((webhook) => {
          const existingWebhook = webhooks.find(
            (w) =>
              w.topic === webhook.topic &&
              w.callbackUrl === webhook.callbackUrl.replace("[shopId]", shopId)
          );
          return !existingWebhook ? (
            <RecommendedWebhookItem
              key={webhook.topic}
              webhook={webhook}
              refetch={refetch}
              shopId={shopId}
            />
          ) : null;
        })}
      </div>
    </div>
  );
};
