import React, { useState } from "react";
import { useMutation, gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { useToasts } from "@keystone/screens";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/tooltip";

const CREATE_CHANNEL_WEBHOOK = gql`
  mutation CreateChannelWebhook(
    $channelId: ID!
    $topic: String!
    $endpoint: String!
  ) {
    createChannelWebhook(
      channelId: $channelId
      topic: $topic
      endpoint: $endpoint
    ) {
      success
      error
      webhookId
    }
  }
`;

const DELETE_CHANNEL_WEBHOOK = gql`
  mutation DeleteChannelWebhook($channelId: ID!, $webhookId: ID!) {
    deleteChannelWebhook(channelId: $channelId, webhookId: $webhookId) {
      success
      error
    }
  }
`;

const GET_CHANNEL_WEBHOOKS = gql`
  query GetChannelWebhooks($channelId: ID!) {
    getChannelWebhooks(channelId: $channelId) {
      id
      callbackUrl
      topic
    }
  }
`;

const RECOMMENDED_WEBHOOKS = [
  {
    callbackUrl: "/api/handlers/channel/cancel-purchase/[channelId]",
    topic: "ORDER_CANCELLED",
    description:
      "When a purchase order is cancelled by this channel, enabling this will notify Openship to mark the cart item as cancelled and move the order to PENDING for reprocessing.",
  },
  {
    callbackUrl: "/api/handlers/channel/create-tracking/[channelId]",
    topic: "TRACKING_CREATED",
    description:
      "When a purchase order is fulfilled by this channel, enabling this will notify Openship to add the tracking to the order and shop.",
  },
];

const WebhookItem = ({ webhook, refetch, channelId }) => {
  const [deleteWebhook] = useMutation(DELETE_CHANNEL_WEBHOOK);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteWebhook({
      variables: {
        channelId,
        webhookId: webhook.id,
      },
    })
      .then(({ /* data, */ errors }) => {
        // we're checking for path being undefined OR path.length === 1 because errors with a path larger than 1 will
        // be field level errors which are handled seperately and do not indicate a failure to
        // update the item, path being undefined generally indicates a failure in the graphql mutation itself - ie a type error
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
            // title: data.item[list.labelField] || data.item.id,
            tone: "positive",
            title: "Webhook deleted successfully",
            // message: 'Saved successfully',
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
      <div className="flex flex-col gap-0.5 bg-muted p-2 rounded-lg text-xs text-muted-foreground">
        <span className="opacity-90 font-medium">Callback URL:</span>
        {webhook.callbackUrl}
      </div>
    </div>
  );
};

const RecommendedWebhookItem = ({ webhook, refetch, channelId }) => {
  const [createWebhook, { loading, error }] = useMutation(
    CREATE_CHANNEL_WEBHOOK
  );
  const toasts = useToasts();

  const handleCreate = async () => {
    await createWebhook({
      variables: {
        channelId,
        topic: webhook.topic,
        endpoint: webhook.callbackUrl.replace("[channelId]", channelId),
      },
    })
      .then(({ /* data, */ errors }) => {
        // we're checking for path being undefined OR path.length === 1 because errors with a path larger than 1 will
        // be field level errors which are handled seperately and do not indicate a failure to
        // update the item, path being undefined generally indicates a failure in the graphql mutation itself - ie a type error
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
            // title: data.item[list.labelField] || data.item.id,
            tone: "positive",
            title: "Webhook created successfully",
            // message: 'Saved successfully',
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
        <BadgeButton
          color="blue"
          className="text-[.6rem] uppercase tracking-wide py-0 px-1 border"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </BadgeButton>
      </div>
      {/* <div className="flex flex-col gap-0.5 bg-muted p-2 rounded-lg text-xs text-muted-foreground">
        <span className="opacity-90 font-medium">Description:</span>
        {webhook.description}
      </div> */}
    </div>
  );
};

export const Webhooks = ({ channelId }) => {
  const { data, loading, error, refetch } = useQuery(GET_CHANNEL_WEBHOOKS, {
    variables: { channelId },
  });

  if (loading) {
    return <div>Loading webhooks...</div>;
  }

  if (error) {
    return (
      <Badge color="rose" className="opacity-80 text-xs w-full">
        Error loading webhooks:{" "}
        {error?.graphQLErrors[0]?.extensions?.originalError?.message}
      </Badge>
    );
  }

  const webhooks = data.getChannelWebhooks;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {webhooks.map((webhook) => (
          <WebhookItem
            key={webhook.id}
            webhook={webhook}
            refetch={refetch}
            channelId={channelId}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {RECOMMENDED_WEBHOOKS.map((webhook) => {
          const existingWebhook = webhooks.find(
            (w) =>
              w.topic === webhook.topic &&
              w.callbackUrl ===
                webhook.callbackUrl.replace("[channelId]", channelId)
          );
          return !existingWebhook ? (
            <RecommendedWebhookItem
              key={webhook.topic}
              webhook={webhook}
              refetch={refetch}
              channelId={channelId}
            />
          ) : null;
        })}
      </div>
    </div>
  );
};