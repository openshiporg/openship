import React, { useState } from "react";
import useSWR from "swr";
import { SHOPS_QUERY } from "@graphql/shops";
import { gqlFetcher } from "@lib/gqlFetcher";
import { useSharedState } from "@lib/useSharedState";
import { EditProduct } from "./editProduct";
import { ProductSearch } from "./Search";

export function ShopProductSearch({
  swrKey,
  disabled,
  addToCart,
  atcText = "Add To Cart",
}) {
  const { data, error } = useSWR(SHOPS_QUERY, gqlFetcher);

  const [editProduct, setEditProduct] = useState(null);

  const productButtons = [
    {
      buttonText: "edit product",
      color: "blue",
      onClick: ({ product }) => {
        setEditProduct(product);
      },
    },
  ];

  const [searchEntry, setSearchEntry] = useSharedState(
    `${swrKey}shopSearchEntry`,
    ""
  );

  return (
    <>
      {editProduct && (
        <EditProduct
          product={editProduct}
          isOpen={editProduct}
          onClose={() => setEditProduct(null)}
          searchEntry={searchEntry}
        />
      )}
      {data?.shops ? (
        <ProductSearch
          key="shop"
          title={`${swrKey}shop`}
          options={data?.shops}
          optionName="Shop"
          disabled={disabled}
          atcText={atcText}
          addToCart={addToCart}
          color="green"
          searchEntry={searchEntry}
          setSearchEntry={setSearchEntry}
        />
      ) : (
        <></>
      )}
    </>
  );
}
