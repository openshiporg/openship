import { Box, Skeleton, Group } from "@mantine/core";
import useSWR from "swr";
import { CartItem } from "@primitives/cartItem";

const objectsEqual = (o1, o2) =>
  typeof o1 === "object" && Object.keys(o1).length > 0
    ? Object.keys(o1).length === Object.keys(o2).length &&
      Object.keys(o1).every((p) => objectsEqual(o1[p], o2[p]))
    : o1 === o2;

const arraysEqual = (a1, a2) =>
  a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

const compare = (a, b) => {
  const bandA = a.name.toUpperCase();
  const bandB = b.name.toUpperCase();

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
};

export function CartList({
  shopId,
  accessToken,
  domain,
  searchEntry,
  shopName,
  searchProductsEndpoint,
}) {
  const params = new URLSearchParams({
    accessToken,
    domain,
    searchEntry: searchEntry.map(({ name }) => name),
    shopName,
  }).toString();

  const url = `${searchProductsEndpoint}?${params}`;

  const { data, error } = useSWR(url, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  if (error) {
    return <Box>Something went wrong. Please try again later.</Box>;
  }

  if (!data) return <Skeleton height={100} />;

  return (
    <Box>
      {data?.orders
        ?.filter(
          (order) =>
            order.cart !== null &&
            arraysEqual(
              order.lineItems
                .map(({ name, quantity }) => ({
                  name,
                  quantity,
                }))
                .sort(compare),
              searchEntry.sort(compare)
            )
        )
        .map(({ cartItems }) => (
          <Box>
            {cartItems?.length > 0 && (
              <Box p={4} bg="green.50">
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
                    url,
                    error,
                  }) => (
                    <Box>
                      <CartItem
                        image={image}
                        lineId={lineItemId}
                        title={name}
                        productId={productId}
                        variantId={variantId}
                        quantity={quantity}
                        price={price}
                        channelName={channel?.name}
                        error={error}
                      />
                    </Box>
                  )
                )}
              </Box>
            )}
          </Box>
        ))}
    </Box>
  );
}
