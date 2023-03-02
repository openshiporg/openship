import React, { useState } from "react";
import { useNotifications } from "@mantine/notifications";
import {
  Box,
  Button,
  Menu,
  useMantineTheme,
  Loader,
  ActionIcon,
  Divider,
  Text,
  Group,
  Skeleton,
} from "@mantine/core";
import { mutate } from "swr";
import { Order } from "@primitives/order";
import { LineItem } from "@primitives/lineItem";
import { CartItem } from "@primitives/cartItem";
import { QuantityCounter } from "@primitives/quantityCounter";
import { Collapse } from "@primitives/collapse";
import { ErrorTooltip } from "@primitives/errorTooltip";
import {
  GlobeIcon,
  KebabHorizontalIcon,
  AlertFillIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  XIcon,
} from "@primer/octicons-react";
import { EditOrder } from "./editOrder";
import { EditCartItem } from "./editCartItem";
import { PreviousCarts } from "./previousCarts";
import { EditProduct } from "../ProductSearch/editProduct";
import {
  PLACE_ORDERS,
  ORDER_COUNT_QUERY,
  UPDATE_ORDER,
  DELETE_ORDER,
  ADD_TO_CART_MUTATION,
} from "@graphql/orders";
import { ADDMATCHTOCART_MUTATION, MATCHORDER_MUTATION } from "@graphql/matches";
import { DELETE_CARTITEM_MUTATION, UPDATE_CARTITEM } from "@graphql/cartItems";
import request from "graphql-request";
import { ChannelProductSearch } from "@components/ProductSearch";

export function OsOrderList({
  data,
  mutateOrders,
  orderCountMutate,
  status,
  orderPerPage,
}) {
  const theme = useMantineTheme();

  const [editProduct, setEditProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editCartItem, setEditCartItem] = useState(null);
  const [previousCarts, setPreviousCarts] = useState(null);
  const [loading, setLoading] = useState(null);
  const [loadingColor, setLoadingColor] = useState(null);
  const [loadingID, setLoadingID] = useState(null);

  const editOrderDetails = data?.orders?.filter(
    ({ id }) => id === editOrder
  )[0];

  const previousCartsDetails = data?.orders?.filter(
    ({ id }) => id === previousCarts
  )[0];

  const editCartItemDetails =
    editOrder &&
    editCartItem &&
    data?.orders
      ?.filter(({ id }) => id === editOrder)[0]
      ?.cartItems.filter(({ id }) => id === editCartItem)[0];

  const notifications = useNotifications();

  function updateOrderCache(updatedOrder) {
    return mutateOrders(({ orders }) => {
      const newData = [];
      for (const item of orders) {
        if (item.id === updatedOrder.id) {
          newData.push(updatedOrder);
        } else {
          newData.push(item);
        }
      }
      return {
        orders: newData,
      };
    }, false);
  }

  const fetchGQL = async ({ query, values, success, callback }) => {
    const res = await request("/api/graphql", query, values)
      .then(async (data) => {
        callback && callback({ returnedData: data });
        success &&
          notifications.showNotification({
            title: success,
          });
      })
      .catch((error) => {
        notifications.showNotification({
          title: error.response?.errors[0].extensions.code,
          message: error.response?.errors[0].message,
          color: "red",
        });
      });

    // try {
    //   const data = await request("/api/graphql", query, values);
    //   if (callback) callback({ returnedData: data });
    //   if (success)
    //     notifications.showNotification({
    //       title: success,
    //     });
    // } catch (error) {
    //   console.error(error);

    //   notifications.showNotification({
    //     title: error.message.split(":")[0],
    //     message: error.message.split(":")[1],
    //   });
    // }
  };

  const placeOrder = async ({ orderId }) => {
    const res = await request("/api/graphql", PLACE_ORDERS, {
      ids: [orderId],
    })
      .then(async () => {
        mutateOrders();
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "PENDING" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "INPROCESS" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "AWAITING" } } }),
        ]);
        notifications.showNotification({
          title: success,
        });
      })
      .catch((error) => {
        error.response &&
          notifications.showNotification({
            title: error.response.errors[0].extensions.code,
            message: error.response.errors[0].message,
            color: "red",
          });
      });
  };

  const deleteOrderErrors = async ({ orderId }) => {
    await fetchGQL({
      values: {
        id: orderId,
        data: { orderError: "" },
      },
      query: UPDATE_ORDER,
      success: "Error deleted",
      callback: ({ returnedData }) => {
        updateOrderCache(returnedData.updateOrder);
      },
    });
  };

  const deleteCartItemErrors = async ({ orderId }) => {
    const res = await request("/api/graphql", UPDATE_ORDER, {
      id: orderId,
      data: { orderError: null },
    })
      .then(async (data) => {
        mutateOrders(({ orders }) => {
          const newData = [];
          for (const item of orders) {
            if (item.id === returnedData.id) {
              newData.push(returnedData);
            } else {
              newData.push(item);
            }
          }
          return { orders: newData };
        }, false);
      })
      .catch((error) => {
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });
  };

  const orderButtons = [
    {
      buttonText: "GET MATCH",
      color: "green",
      icon: <GlobeIcon />,
      onClick: async ({ orderId }) => {
        setLoadingColor("green");
        setLoading("Getting Match");
        setLoadingID(orderId);
        await fetchGQL({
          values: { orderId },
          query: ADDMATCHTOCART_MUTATION,
          success: "Match has been added",
          callback: ({ returnedData }) => {
            updateOrderCache(returnedData.addMatchToCart);
          },
        });
        setLoadingColor(null);
        setLoading(null);
        setLoadingID(null);
      },
    },
    {
      buttonText: "SAVE MATCH",
      color: "teal",
      icon: <GlobeIcon />,
      onClick: async ({ orderId }) => {
        setLoadingColor("cyan");
        setLoading("Saving Match");
        setLoadingID(orderId);
        await fetchGQL({
          values: { orderId },
          query: MATCHORDER_MUTATION,
          success: "Cart has been matched",
        });
        setLoadingColor(null);
        setLoading(null);
        setLoadingID(null);
      },
    },
    {
      buttonText: "PLACE ORDER",
      color: "cyan",
      icon: <GlobeIcon />,
      onClick: async ({ orderId }) => {
        setLoadingColor("blue");
        setLoading("Processing");
        setLoadingID(orderId);
        await placeOrder({ orderId });
        setLoadingColor(null);
        setLoading(null);
        setLoadingID(null);
      },
    },
    {
      buttonText: "EDIT ORDER",
      color: "blue",
      icon: <GlobeIcon />,
      onClick: ({ orderId }) => {
        setEditOrder(orderId);
      },
    },
    // {
    //   buttonText: "SHOW PREVIOUS CARTS",
    //   color: "grape",
    //   icon: <GlobeIcon />,
    //   onClick: ({ orderId }) => {
    //     setPreviousCarts(orderId);
    //   },
    // },
    {
      buttonText: "DELETE ORDER",
      color: "red",
      icon: <GlobeIcon />,
      onClick: async ({ orderId }) => {
        setLoadingColor("red");
        setLoading("Deleting");
        setLoadingID(orderId);
        // await fetchGQL({
        //   values: { id: orderId },
        //   query: DELETE_CARTITEM,
        // });
        // await fetchGQL({
        //   values: { id: orderId },
        //   query: DELETE_CARTITEM,
        // });
        await fetchGQL({
          values: { id: orderId },
          query: DELETE_ORDER,
          success: "Order has been deleted",
          callback: () => {
            mutateOrders();
            orderCountMutate();
            mutate([
              ORDER_COUNT_QUERY,
              JSON.stringify({ where: { status: { equals: status } } }),
            ]);
          },
        });
        setLoadingColor(null);
        setLoading(null);
        setLoadingID(null);
      },
    },
  ];

  const lineItemButtons = [
    {
      buttonText: "Edit Product",
      color: "lightBlue",
      icon: <GlobeIcon />,
      onClick: ({ product }) => {
        setEditProduct(product);
      },
    },
  ];

  const cartItemButtons = [
    {
      buttonText: "EDIT CART ITEM",
      color: "blue",
      onClick: ({ orderId, cartItemId }) => {
        setEditOrder(orderId);
        setEditCartItem(cartItemId);
      },
    },
  ];

  return (
    <Box>
      {editProduct && (
        <EditProduct
          product={editProduct}
          isOpen={editProduct}
          onClose={() => setEditProduct(null)}
        />
      )}
      {editOrderDetails && !editCartItemDetails && (
        <EditOrder
          isOpen={editOrderDetails}
          onClose={() => setEditOrder(null)}
          order={editOrderDetails}
          mutateOrders={mutateOrders}
        />
      )}
      {editCartItemDetails && (
        <EditCartItem
          isOpen={editCartItem}
          onClose={() => {
            setEditOrder(null);
            setEditCartItem(null);
          }}
          cartItem={editCartItemDetails}
          mutateOrders={mutateOrders}
        />
      )}
      {previousCartsDetails && (
        <PreviousCarts
          isOpen={previousCarts}
          onClose={() => setPreviousCarts(null)}
          order={previousCartsDetails}
          mutateOrders={mutateOrders}
        />
      )}
      {!data && (
        <>
          <Skeleton height={100} radius={0} animate={true} />
          <Divider />
          <Skeleton height={100} radius={0} animate={true} />
        </>
      )}
      {data?.orders?.map((order) => {
        const {
          id,
          orderId,
          shop,
          orderName,
          first_name,
          last_name,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          createdAt,
          cartItems,
          lineItems,
          orderError,
        } = order;
        return (
          <Box
            key={id}
            sx={{
              borderTop: `1px solid ${
                theme.colorScheme === "light"
                  ? theme.colors.blueGray[2]
                  : theme.colors.dark[8]
              }`,
            }}
          >
            <Collapse
              key={id}
              defaultOpen={orderPerPage === 1 && true}
              component={({ open, setOpen }) => (
                <>
                  <Box
                    onClick={() =>
                      setSelectedOrder ? setSelectedOrder(id) : null
                    }
                  >
                    <Order
                      key={id}
                      shopName={shop.name}
                      title={orderName}
                      link={`https://${shop.domain}/admin/orders/${orderId}`}
                      date={Intl.DateTimeFormat("en-US").format(
                        Date.parse(createdAt)
                      )}
                      open={open}
                      setOpen={setOpen}
                      address={
                        <>
                          {" "}
                          {first_name} {last_name}
                          <br />
                          {streetAddress1} {streetAddress2}
                          <br />
                          {city}
                          {", "}
                          {state} {zip}
                        </>
                      }
                      buttons={
                        <>
                          {loading && loadingID === id && (
                            <Button
                              color={loadingColor ?? "blue"}
                              compact
                              size="xs"
                              uppercase
                              variant="subtle"
                              pointerEvents="none"
                              leftIcon={
                                <Loader
                                  size={14}
                                  color={loadingColor ?? "blue"}
                                />
                              }
                              // loading
                            >
                              {loading}
                            </Button>
                          )}
                          <Menu
                            size="lg"
                            control={
                              <ActionIcon
                                color="cyan"
                                variant="light"
                                size="xs"
                              >
                                <KebabHorizontalIcon size={10} />
                              </ActionIcon>
                            }
                            styles={{
                              item: {
                                color:
                                  theme.colorScheme === "dark"
                                    ? theme.colors.blueGray[2]
                                    : theme.colors.blueGray[7],
                                textTransform: "uppercase",
                                fontWeight: 600,
                                letterSpacing: 0.4,
                              },
                            }}
                          >
                            <Menu.Label>Order Actions</Menu.Label>
                            {orderButtons.map(
                              ({
                                color,
                                icon,
                                endpoint,
                                buttonText,
                                success,
                                onClick,
                              }) => (
                                <Menu.Item
                                  onClick={() => onClick({ orderId: id })}
                                  color={color}
                                  // sx={{ color: theme.colors[color] }}
                                  // icon={icon}
                                >
                                  {buttonText}
                                </Menu.Item>
                              )
                            )}
                          </Menu>
                        </>
                      }
                      error={
                        orderError && (
                          <>
                            <ErrorTooltip
                              onClick={() => deleteOrderErrors({ orderId: id })}
                              label={orderError}
                              buttonText="1 ERROR"
                            />
                          </>
                        )
                      }
                    />
                  </Box>
                  {open && (
                    <>
                      <Divider />
                      <Box
                        sx={{
                          // background:
                          //   theme.colorScheme === 'dark'
                          //     ? theme.fn.rgba(theme.colors.blue[7], 0.35)
                          //     : theme.colors.blue[0],

                          background: theme.fn.rgba(
                            theme.fn.themeColor(
                              "blue",
                              theme.colorScheme === "dark" ? 8 : 0
                            ),
                            theme.colorScheme === "dark" ? 0.25 : 1
                          ),

                          padding: 12,
                        }}
                      >
                        <Text
                          size="sm"
                          weight={600}
                          color={
                            theme.colorScheme === "dark"
                              ? theme.colors.blue[0]
                              : theme.colors.blue[9]
                          }
                          mb={10}
                        >
                          Line Items
                        </Text>
                        {lineItems.map(
                          ({
                            id: lineId,
                            name,
                            quantity,
                            price,
                            image,
                            productId,
                            variantId,
                            lineItemId,
                          }) => (
                            <LineItem
                              key={lineId}
                              image={image}
                              lineId={lineItemId}
                              title={name}
                              productId={productId}
                              variantId={variantId}
                              quantity={quantity}
                              price={price}
                              buttons={
                                <Menu
                                  size="lg"
                                  control={
                                    <ActionIcon
                                      color="blue"
                                      variant="light"
                                      size="sm"
                                    >
                                      <KebabHorizontalIcon size={10} />
                                    </ActionIcon>
                                  }
                                  styles={{
                                    item: {
                                      color:
                                        theme.colorScheme === "dark"
                                          ? theme.colors.blueGray[2]
                                          : theme.colors.blueGray[7],
                                      textTransform: "uppercase",
                                      fontWeight: 600,
                                      letterSpacing: 0.4,
                                    },
                                  }}
                                >
                                  <Menu.Label>Actions</Menu.Label>
                                  {lineItemButtons.map(
                                    ({ color, buttonText, onClick, icon }) => (
                                      <Menu.Item
                                        color={color}
                                        onClick={() =>
                                          onClick({
                                            product: {
                                              productId,
                                              variantId,
                                              price,
                                              title: name,
                                              image,
                                              domain: shop.domain,
                                              accessToken: shop.accessToken,
                                              updateProductEndpoint:
                                                shop.updateProductEndpoint,
                                            },
                                          })
                                        }
                                        // sx={{ color: theme.colors[color] }}
                                        // icon={icon}
                                      >
                                        {buttonText}
                                      </Menu.Item>
                                    )
                                  )}
                                </Menu>
                              }
                            />
                          )
                        )}
                      </Box>
                      {cartItems?.length > 0 && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              // background:
                              //   theme.colorScheme === 'dark'
                              //     ? theme.fn.rgba(theme.colors.teal[9], .25)
                              //     : theme.colors.teal[0],

                              background: theme.fn.rgba(
                                theme.fn.themeColor(
                                  "teal",
                                  theme.colorScheme === "dark" ? 9 : 0
                                ),
                                theme.colorScheme === "dark" ? 0.25 : 1
                              ),

                              padding: 12,
                            }}
                          >
                            <Text
                              size="sm"
                              weight={600}
                              color={
                                theme.colorScheme === "dark"
                                  ? theme.colors.green[0]
                                  : theme.colors.green[9]
                              }
                              mb={10}
                            >
                              Cart Items
                            </Text>
                            {cartItems.map(
                              ({
                                id: cartId,
                                name,
                                quantity,
                                price,
                                image,
                                productId,
                                variantId,
                                purchaseId,
                                lineItemId,
                                channel,
                                url: cartURL,
                                error,
                                status,
                              }) => (
                                <Box pt={1} _first={{ pt: 0 }} key={cartId}>
                                  <CartItem
                                    image={image}
                                    lineId={lineItemId}
                                    title={name}
                                    productId={productId}
                                    variantId={variantId}
                                    purchaseId={purchaseId}
                                    quantity={quantity}
                                    price={price}
                                    channelName={channel?.name}
                                    buttons={
                                      <>
                                        {cartURL ? (
                                          <Button
                                            component="a"
                                            variant="light"
                                            radius="sm"
                                            size="xs"
                                            compact
                                            uppercase
                                            color={
                                              status !== "CANCELLED"
                                                ? "teal"
                                                : "red"
                                            }
                                            styles={{
                                              rightIcon: { marginLeft: 5 },
                                            }}
                                            href={cartURL}
                                            target="_blank"
                                            // sx={{ padding: 0 }}
                                            rightIcon={<ArrowRightIcon />}
                                          >
                                            {status || "Order"}
                                          </Button>
                                        ) : (
                                          <>
                                            <QuantityCounter
                                              quantity={quantity}
                                              label={false}
                                              setQuantity={(e) =>
                                                fetchGQL({
                                                  values: {
                                                    id: cartId,
                                                    data: {
                                                      quantity: parseInt(e),
                                                    },
                                                  },
                                                  query: UPDATE_CARTITEM,
                                                  success:
                                                    "Item has been updated",
                                                  callback: ({
                                                    returnedData,
                                                  }) =>
                                                    updateOrderCache(
                                                      returnedData
                                                        .updateCartItem.order
                                                    ),
                                                })
                                              }
                                            />
                                            {/* <RemoveFromCart id={cartId} /> */}
                                            <ActionIcon
                                              color="red"
                                              variant="light"
                                              size="sm"
                                              onClick={() =>
                                                fetchGQL({
                                                  values: { id: cartId },
                                                  query:
                                                    DELETE_CARTITEM_MUTATION,
                                                  success:
                                                    "Item has been deleted",
                                                  callback: ({
                                                    returnedData,
                                                  }) => {
                                                    const filteredOrder = {
                                                      ...order,
                                                      cartItems:
                                                        order.cartItems.filter(
                                                          (c) =>
                                                            c.id !==
                                                            returnedData
                                                              .deleteCartItem.id
                                                        ),
                                                    };
                                                    updateOrderCache(
                                                      filteredOrder
                                                    );
                                                  },
                                                })
                                              }
                                            >
                                              <XIcon size={10} />
                                            </ActionIcon>
                                          </>
                                        )}

                                        <Menu
                                          size="lg"
                                          control={
                                            <ActionIcon
                                              color="cyan"
                                              variant="light"
                                              size="sm"
                                            >
                                              <KebabHorizontalIcon size={10} />
                                            </ActionIcon>
                                          }
                                          styles={{
                                            item: {
                                              color:
                                                theme.colorScheme === "dark"
                                                  ? theme.colors.blueGray[2]
                                                  : theme.colors.blueGray[7],
                                              textTransform: "uppercase",
                                              fontWeight: 600,
                                              letterSpacing: 0.4,
                                            },
                                          }}
                                        >
                                          <Menu.Label>Actions</Menu.Label>
                                          {cartItemButtons.map(
                                            ({
                                              color,
                                              endpoint,
                                              buttonText,
                                              success,
                                              onClick,
                                            }) => (
                                              <Menu.Item
                                                color={color}
                                                onClick={() =>
                                                  onClick({
                                                    orderId: id,
                                                    cartItemId: cartId,
                                                  })
                                                }
                                                // sx={{ color: theme.colors[color] }}
                                                // icon={icon}
                                              >
                                                {buttonText}
                                              </Menu.Item>
                                            )
                                          )}
                                        </Menu>
                                      </>
                                    }
                                    error={
                                      error && (
                                        <ErrorTooltip
                                          onClick={() =>
                                            fetchGQL({
                                              values: {
                                                id: cartId,
                                                data: { error: "" },
                                              },
                                              query: UPDATE_CARTITEM,
                                              callback: ({ returnedData }) =>
                                                updateOrderCache(
                                                  returnedData.updateCartItem
                                                    .order
                                                ),
                                            })
                                          }
                                          label={error}
                                          buttonText={
                                            <AlertFillIcon size={10} />
                                          }
                                        />
                                      )
                                    }
                                  />
                                </Box>
                              )
                            )}
                          </Box>
                        </>
                      )}

                      {status === "PENDING" && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              // background:
                              //   theme.colorScheme === 'dark'
                              //     ? theme.fn.rgba(theme.colors.blue[7], 0.35)
                              //     : theme.colors.blue[0],

                              background: theme.fn.rgba(
                                theme.fn.themeColor(
                                  "blueGray",
                                  theme.colorScheme === "dark" ? 8 : 0
                                ),
                                theme.colorScheme === "dark" ? 0.35 : 1
                              ),

                              paddingLeft: 12,
                              paddingRight: 12,
                              paddingTop: 8,
                              paddingBottom: 8,
                            }}
                          >
                            <Collapse
                              defaultOpen={orderPerPage === 1 && true}
                              component={({ open, setOpen }) => (
                                <>
                                  <Group>
                                    <Text
                                      size="sm"
                                      weight={600}
                                      color={
                                        theme.colorScheme === "dark"
                                          ? theme.colors.blueGray[0]
                                          : theme.colors.blueGray[9]
                                      }
                                    >
                                      Channel Search
                                    </Text>
                                    <ActionIcon
                                      size="sm"
                                      color="blue"
                                      variant="light"
                                      onClick={() => setOpen(!open)}
                                      sx={{ marginLeft: "auto" }}
                                      aria-label="show line-items"
                                    >
                                      <ChevronDownIcon />
                                    </ActionIcon>
                                    {/* <Button
                                    height="1.3rem"
                                    minWidth="1.3rem"
                                    px={0}
                                    bgGradient="linear(to-b, #fff, cyan.50)"
                                    boxShadow="clean"
                                    ml="auto"
                                    onClick={() => setOpen(!open)}
                                  >
                                    {open ? (
                                      <ChevronDownIcon />
                                    ) : (
                                      <ChevronUpIcon />
                                    )}
                                  </Button> */}
                                  </Group>
                                  {open && (
                                    <Box mt={8}>
                                      <ChannelProductSearch
                                        swrKey="orderPage"
                                        addToCart={(values) =>
                                          fetchGQL({
                                            values: {
                                              orderId: id,
                                              ...values,
                                            },
                                            query: ADD_TO_CART_MUTATION,
                                            success: "Item has been added",
                                            callback: ({ returnedData }) =>
                                              updateOrderCache(
                                                returnedData.addToCart
                                              ),
                                          })
                                        }
                                      />
                                    </Box>
                                  )}
                                </>
                              )}
                            />
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            />
          </Box>
        );
      })}
    </Box>
  );
}
