import { Box, Center, Skeleton } from "@mantine/core";
import useSWR from "swr";

import { Product } from "@primitives/product";

export function ProductList({
  optionId,
  optionName,
  accessToken,
  domain,
  searchProductsEndpoint,
  updateProductEndpoint,
  disabled,
  addToCart,
  searchEntry,
  atcText,
  buttons,
}) {
  const params = new URLSearchParams({
    accessToken,
    domain,
    searchEntry,
  }).toString();

  const url = `${searchProductsEndpoint}?${params}`;

  const fetcher = async (url) => {
    try {
      const res = await fetch(url);
      return res.json();
    } catch (e) {
      throw e.message;
    }
  };

  const { data, error } = useSWR(url, fetcher);

  if (error) {
    return <Center my={10}>{error}</Center>;
  }

  if (!data)
    return (
      <>
        <Skeleton height={120} radius={0} />
      </>
    );

  console.log({ data });
  return (
    <Box>
      {data?.products?.map(
        ({
          productId,
          variantId,
          title,
          image,
          price,
          availableForSale,
          productLink,
        }) => (
          <Product
            key={productId + variantId}
            productLink={productLink}
            image={image}
            title={title}
            productId={productId}
            variantId={variantId}
            price={price}
            disabled={!availableForSale || disabled}
            channelId={optionId}
            channelName={optionName}
            addToCart={addToCart}
            atcText={availableForSale ? atcText : "OUT OF STOCK"}
            accessToken={accessToken}
            searchProductsEndpoint={searchProductsEndpoint}
            updateProductEndpoint={updateProductEndpoint}
            domain={domain}
            buttons={buttons}
          />
        )
      )}
    </Box>
  );
}
