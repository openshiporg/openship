import { Box, Drawer } from "@mantine/core";

import { CartList } from "./CartList";

export const PreviousCarts = ({ isOpen, onClose, order, mutateOrders }) => {
  const searchEntry = order.lineItems.map(({ name, quantity }) => ({
    name,
    quantity,
  }));

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={
        <Text size="xl" weight={600}>
          Edit Order
        </Text>
      }
      padding="xl"
      size="lg"
      position="right"
    >
      <Box>
        {order.shop.searchOrdersEndpoint}
        <CartList
          accessToken={order.shop.accessToken}
          domain={order.shop.domain}
          shopId={order.shop.id}
          searchEntry={searchEntry}
          searchProductsEndpoint={order.shop.searchOrdersEndpoint}
          shopName={order.shop.name}
        />
      </Box>
    </Drawer>
  );
};
