import { useState } from "react";
import { Text, useMantineTheme, Select, Modal } from "@mantine/core";
import { mutate } from "swr";
import { request } from "graphql-request";
import { CREATE_SHOP_MUTATION, SHOPS_QUERY } from "@graphql/shops";
import { useNotifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { ShopForm } from "./ShopForm";

//hardcoded endpoints fetched through state type
const endpoints = {
  shopify: {
    searchProductsEndpoint: "/api/search-products/shopify",
    searchOrdersEndpoint: "/api/search-orders/shopify",
    updateProductEndpoint: "/api/update-product/shopify",
    getWebhooksEndpoint: "/api/get-webhooks/shopify",
    createWebhookEndpoint: "/api/create-webhook/shopify",
    deleteWebhookEndpoint: "/api/delete-webhook/shopify",
  },
  demo: {
    domain: "https://openship-shop.vercel.app",
    accessToken: "supersecret",
    searchProductsEndpoint: "https://openship-shop.vercel.app/api/search-products",
    searchOrdersEndpoint: "https://openship-shop.vercel.app/api/search-orders",
  },
};

export const CreateShopView = ({ showModal, setShowModal }) => {
  const notifications = useNotifications();
  const router = useRouter();
  const theme = useMantineTheme();
  const [type, setType] = useState("shopify");
  const [loading, setLoading] = useState(false);
  // const { data: channelData, error: channelError } = useSWR(CHANNELS_QUERY, gqlFetcher);

  const createShop = async (values) => {
    setLoading(true);
    // setError(null);

    const res = await request("/api/graphql", CREATE_SHOP_MUTATION, {
      data: {
        ...values,
      },
    })
      .then(async () => {
        await mutate(SHOPS_QUERY);

        notifications.showNotification({
          title: `Shop has been added.`,
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

  const ShopForms = {
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
        router.push(`/api/o-auth/shop/shopify?shop=${values.shop}`),
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
        createShop({
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
        router.push(`/api/o-auth/shop/bigcommerce?shop=${values.shop}`),
      buttonText: "Connect BigCommerce",
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
        createShop({
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
        createShop({
          type: "demo",
          ...values,
          ...endpoints.demo,
        }),
    },
  };

  return (
    <Modal
      opened={showModal === "Shop"}
      onClose={() => setShowModal(false)}
      // size="xl"
      title={
        <Text
          weight={600}
          size="xl"
          // transform="uppercase"
          color="gray"
          sx={
            {
              // fontWeight: 700,
              // letterSpacing: 0.6,
            }
          }
        >
          Create Shop
        </Text>
      }
    >
      <Select
        label="Shop Type"
        value={type}
        searchable
        onChange={(value) => {
          setType(value);
        }}
        data={Object.keys(ShopForms).map((key) => ({
          value: key,
          label: ShopForms[key].label,
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
      {ShopForms[type].component}
      <ShopForm key={type} loading={loading} {...ShopForms[type]} />
    </Modal>
  );
};
