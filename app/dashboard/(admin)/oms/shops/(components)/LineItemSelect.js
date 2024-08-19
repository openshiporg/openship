import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { Input } from "@ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Button } from "@ui/button";
import { LineItemField } from "./LineItemField";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { BadgeButton } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";

const SEARCH_SHOP_PRODUCTS = gql`
  query SearchShopProducts($shopId: ID!, $searchEntry: String) {
    searchShopProducts(shopId: $shopId, searchEntry: $searchEntry) {
      image
      title
      productId
      variantId
      price
      availableForSale
      productLink
      inventory
      inventoryTracked
    }
  }
`;

export const LineItemSelect = ({ shops, localState, setLocalState, shopId }) => {
  const [searchEntry, setSearchEntry] = useState("");
  const [selectedShopId, setSelectedShopId] = useState(shopId || "");
  const [quantities, setQuantities] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});

  const { data, loading, error } = useQuery(SEARCH_SHOP_PRODUCTS, {
    variables: { shopId: selectedShopId, searchEntry },
    skip: !selectedShopId || !searchEntry,
  });

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchEntry(e.target.value);
    }
  };

  const handleAddItem = (product) => {
    const quantity = quantities[product.productId] || 1;
    setLocalState((prevState) => {
      const existingItemIndex = prevState.lineItems.findIndex(
        (item) =>
          item.productId === product.productId &&
          item.variantId === product.variantId
      );

      if (existingItemIndex !== -1) {
        // If the item already exists, create a new array with the updated item
        return {
          ...prevState,
          lineItems: prevState.lineItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      } else {
        // If it's a new item, add it to the lineItems
        return {
          ...prevState,
          lineItems: [
            ...prevState.lineItems,
            {
              ...product,
              quantity,
              shop: shops.find((s) => s.id === selectedShopId),
            },
          ],
        };
      }
    });
    setQuantities({ ...quantities, [product.productId]: 1 });
    setLocalQuantities({ ...localQuantities, [product.productId]: 1 });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setQuantities({ ...quantities, [productId]: newQuantity });
    setLocalQuantities({ ...localQuantities, [productId]: newQuantity });
  };

  const handleQuantityBlur = (productId) => {
    const quantity = localQuantities[productId] || quantities[productId] || 1;
    setQuantities({ ...quantities, [productId]: Math.max(1, quantity) });
    setLocalQuantities({
      ...localQuantities,
      [productId]: Math.max(1, quantity),
    });
  };

  const handleQuantityKeyDown = (e, productId) => {
    if (e.key === "Enter") {
      handleQuantityBlur(productId);
    }
  };

  return (
    <div className="mt-4">
      <div className="border rounded-md overflow-hidden">
        <div className="text-sm font-medium text-gray-500 px-4 py-2">
          Line Items
        </div>
        {localState.lineItems.length > 0 ? (
          <div className="space-y-2 p-2">
            {localState.lineItems.map((item, index) => (
              <LineItemField
                key={item.id || index}
                {...item}
                index={index}
                onRemove={() => {
                  setLocalState((prevState) => ({
                    ...prevState,
                    lineItems: prevState.lineItems.filter(
                      (_, i) => i !== index
                    ),
                  }));
                }}
                onQuantityChange={(newQuantity) => {
                  setLocalState((prevState) => ({
                    ...prevState,
                    lineItems: prevState.lineItems.map((lineItem, i) =>
                      i === index
                        ? { ...lineItem, quantity: newQuantity }
                        : lineItem
                    ),
                  }));
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 p-4 text-center">
            None added
          </div>
        )}
        <div className="border-t p-4">
          <Input
            placeholder="Search shop products..."
            className="mb-2"
            onKeyPress={handleSearch}
          />
          <Select
            value={selectedShopId}
            onValueChange={setSelectedShopId}
            className="mb-2"
          >
            <SelectTrigger className="text-base shadow-sm">
              <SelectValue placeholder="Select a shop" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          {data?.searchShopProducts && (
            <div className="space-y-2 mt-2 overflow-y-auto w-full">
              {data.searchShopProducts.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center space-x-2 p-2 bg-muted/40 rounded-md"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium">{product.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {product.productId} | {product.variantId}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      <BadgeButton
                        onClick={() =>
                          handleQuantityChange(
                            product.productId,
                            Math.max(
                              1,
                              (quantities[product.productId] || 1) - 1
                            )
                          )
                        }
                        className="px-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </BadgeButton>
                      <input
                        className="mx-1 border rounded-md text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none"
                        style={{
                          width: `${Math.max(
                            2,
                            (
                              localQuantities[product.productId] ||
                              quantities[product.productId] ||
                              1
                            ).toString().length * 0.75
                          )}em`,
                        }}
                        type="text"
                        value={
                          localQuantities[product.productId] ||
                          quantities[product.productId] ||
                          1
                        }
                        onChange={(e) =>
                          setLocalQuantities({
                            ...localQuantities,
                            [product.productId]: e.target.value,
                          })
                        }
                        onBlur={() => handleQuantityBlur(product.productId)}
                        onKeyDown={(e) =>
                          handleQuantityKeyDown(e, product.productId)
                        }
                      />
                      <BadgeButton
                        onClick={() =>
                          handleQuantityChange(
                            product.productId,
                            (quantities[product.productId] || 1) + 1
                          )
                        }
                        className="px-1"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </BadgeButton>
                    </div>
                    <BadgeButton
                      onClick={() => handleAddItem(product)}
                      color="teal"
                      className="px-1"
                    >
                      <Plus className="h-4 w-4" />
                    </BadgeButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
