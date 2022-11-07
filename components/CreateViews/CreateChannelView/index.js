import { useState } from "react";
import { Text, useMantineTheme, Box, Select, Modal } from "@mantine/core";
import { mutate } from "swr";
import { request } from "graphql-request";
import { CHANNELS_QUERY, CREATE_CHANNEL_MUTATION } from "@graphql/channels";
import { useNotifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { ChannelForm } from "./ChannelForm";

//hardcoded endpoints fetched through state type
const endpoints = {
  shopify: {
    searchProductsEndpoint: "/api/search-products/shopify",
    createPurchaseEndpoint: "/api/create-purchase/shopify",
    getWebhooksEndpoint: "/api/get-webhooks/shopify",
    createWebhookEndpoint: "/api/create-webhook/shopify",
    deleteWebhookEndpoint: "/api/delete-webhook/shopify",
  },
  stockandtrace: {
    searchProductsEndpoint: "/api/search-products/stockandtrace",
    createPurchaseEndpoint: "/api/create-purchase/stockandtrace",
    getWebhooksEndpoint: "/api/get-webhooks/shopify",
    createWebhookEndpoint: "/api/create-webhook/shopify",
    deleteWebhookEndpoint: "/api/delete-webhook/shopify",
  },
  demo: {
    domain: "https://openship-channel.vercel.app",
    accessToken: "supersecret",
    searchProductsEndpoint:
      "https://openship-channel.vercel.app/api/search-products",
    createPurchaseEndpoint:
      "https://openship-channel.vercel.app/api/create-purchase",
  },
};

export const CreateChannelView = ({ showModal, setShowModal }) => {
  const notifications = useNotifications();
  const router = useRouter();
  const theme = useMantineTheme();
  const [type, setType] = useState("shopify");
  const [loading, setLoading] = useState(false);

  const createChannel = async (values) => {
    setLoading(true);

    const res = await request("/api/graphql", CREATE_CHANNEL_MUTATION, {
      data: {
        ...values,
      },
    })
      .then(async () => {
        await mutate(CHANNELS_QUERY);

        notifications.showNotification({
          title: `Channel has been added.`,
        });
        setShowModal(false);
      })
      .catch((error) => {
        setLoading(false);
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });
  };

  const ChannelForms = {
    shopify: {
      label: "Shopify",
      fields: [
        {
          title: "URL",
          name: "shop",
          placeholder: "centralbikeshop",
          rightSection: ".myshopify.com",
        },
      ],
      handleSubmit: (values) =>
        router.push(`/api/o-auth/channel/shopify?shop=${values.shop}`),
      buttonText: "Connect Shopify",
    },
    shopifycustom: {
      label: "Shopify Custom",
      fields: [
        { title: "Name", name: "name", placeholder: "Central Bike Shop" },
        { title: "Domain", name: "domain", placeholder: "centralbikeshop.com" },
        {
          title: "Access Token",
          name: "accessToken",
          placeholder: "supersecret",
        },
      ],
      handleSubmit: (values) =>
        createChannel({
          type: "shopify",
          ...values,
          ...endpoints.shopify,
        }),
    },
    bigcommerce: {
      label: "Big Commerce",
      fields: [
        {
          title: "URL",
          name: "shop",
          placeholder: "centralbikeshop",
          rightSection: ".mybigcommerce.com",
          rightSectionWidth: 190
        },
      ],
      handleSubmit: (values) =>
        router.push(`/api/o-auth/channel/bigcommerce?shop=${values.shop}`),
      buttonText: "Connect BigCommerce",
    },
    stockandtrace: {
      label: "Stock & Trace",
      fields: [
        { title: "Name", name: "name", placeholder: "Central Bike Shop" },
        {
          title: "Domain",
          name: "domain",
          placeholder: "centralbikeshop.com",
        },
        {
          title: "Access Token",
          name: "accessToken",
          placeholder: "supersecret",
        },
      ],
      metafields: [
        { title: "Warehouse", name: "Warehouse", placeholder: "WH99" },
        { title: "Account", name: "Account", placeholder: "9837443" },
        { title: "Ship To", name: "Shipto", placeholder: "Supplier" },
      ],
      handleSubmit: ({ metafields, ...values }) =>
        createChannel({
          type: "stockandtrace",
          metafields: { create: metafields },
          ...values,
          //hardcoded values
          ...endpoints.stockandtrace,
        }),
    },
    custom: {
      label: "Custom",
      fields: [
        { title: "Name", name: "name", placeholder: "Central Bike Shop" },
        { title: "Domain", name: "domain", placeholder: "centralbikeshop.com" },
        {
          title: "Access Token",
          name: "accessToken",
          placeholder: "supersecret",
        },
      ],
      handleSubmit: (values) =>
        createChannel({
          type: "custom",
          ...values,
        }),
    },
    demo: {
      label: "Demo",
      fields: [
        { title: "Name", name: "name", placeholder: "Central Bike Shop" },
      ],
      handleSubmit: (values) =>
        createChannel({
          type: "demo",
          ...values,
          ...endpoints.demo,
        }),
    },
  };

  return (
    <Modal
      opened={showModal === "Channel"}
      onClose={() => setShowModal(false)}
      // size="xl"
      title={
        <Text weight={600} size="xl" color="gray">
          Create Channel
        </Text>
      }
    >
      <Select
        label="Channel Type"
        value={type}
        onChange={(value) => {
          setType(value);
        }}
        data={Object.keys(ChannelForms).map((key) => ({
          value: key,
          label: ChannelForms[key].label,
        }))}
        styles={{
          root: {
            position: "relative",
          },

          input: {
            fontWeight: 600,
            color:
              theme.colorScheme === "light"
                ? theme.colors.cyan[7]
                : theme.colors.dark[0],
            height: "auto",
            paddingTop: 18,
            paddingLeft: 13,
            border: `1px solid ${
              theme.colors.blueGray[theme.colorScheme === "dark" ? 7 : 2]
            }`,
            boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            // fontSize: "16px !important",
            textTransform: "uppercase",
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
            "&:focus, &:focus-within": {
              outline: "none",
              borderColor: `${
                theme.colors[theme.primaryColor][
                  theme.colorScheme === "dark" ? 8 : 5
                ]
              } !important`,
            },
          },

          required: {
            display: "none",
            // ":before": { marginLeft: "auto", content: '" required"' },
          },

          error: {
            fontSize: 14,
          },

          label: {
            position: "absolute",
            pointerEvents: "none",
            color: theme.colors.blueGray[theme.colorScheme === "dark" ? 2 : 6],
            fontSize: theme.fontSizes.xs,
            paddingLeft: 14,
            paddingTop: 6,
            zIndex: 1,
          },
          item: {
            fontWeight: 600,
            marginTop: 3,
            textTransform: "uppercase",
          },
        }}
        size="md"
      />
      {ChannelForms[type].component}
      <ChannelForm key={type} loading={loading} {...ChannelForms[type]} />
    </Modal>
  );
};
