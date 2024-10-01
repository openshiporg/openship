import React, { useEffect, useState } from "react";
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
import { CartItemField } from "./CartItemField";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";

const SEARCH_CHANNEL_PRODUCTS = gql`
  query SearchChannelProducts($channelId: ID!, $searchEntry: String) {
    searchChannelProducts(channelId: $channelId, searchEntry: $searchEntry) {
      image
      title
      productId
      variantId
      price
      availableForSale
      productLink
      inventory
      inventoryTracked
      error
    }
  }
`;

export const CartItemSelect = ({ channels, localState, setLocalState }) => {
  const [searchEntry, setSearchEntry] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});
  const [invalidChannels, setInvalidChannels] = useState([]);

  const { data, loading, error } = useQuery(SEARCH_CHANNEL_PRODUCTS, {
    variables: { channelId: selectedChannelId, searchEntry },
    skip: !selectedChannelId || !searchEntry,
  });

  const filterValidCartItems = (cartItems) => {
    return cartItems.filter((item) =>
      channels.some((channel) => channel.id === item.channel?.id)
    );
  };

  useEffect(() => {
    const invalidChannelIds = localState.cartItems
      .filter(
        (item) => !channels.some((channel) => channel.id === item.channel?.id)
      )
      .map((item) => item.channel?.id);
    setInvalidChannels(invalidChannelIds);
  }, [localState.cartItems, channels]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchEntry(e.target.value);
    }
  };

  const handleAddItem = (product) => {
    const quantity = quantities[product.productId] || 1;
    setLocalState((prevState) => {
      const existingItemIndex = prevState.cartItems.findIndex(
        (item) =>
          item.productId === product.productId &&
          item.variantId === product.variantId &&
          item.channel?.id === selectedChannelId
      );

      if (existingItemIndex !== -1) {
        return {
          ...prevState,
          cartItems: prevState.cartItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      } else {
        return {
          ...prevState,
          cartItems: [
            ...prevState.cartItems,
            {
              ...product,
              quantity,
              channel: channels.find((c) => c.id === selectedChannelId),
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

  const validCartItems = filterValidCartItems(localState.cartItems);
  const invalidCartItems = localState.cartItems.filter(
    (item) => !channels.some((channel) => channel.id === item.channel?.id)
  );

  return (
    <div className="mt-4">
      <div className="border rounded-md overflow-hidden">
        <div className="text-sm font-medium text-gray-500 px-4 py-2">
          Cart Items
        </div>
        {invalidCartItems.length > 0 && (
          <div className="mx-2 mb-2">
            <Badge color="rose" className="w-full">
              <div className="flex flex-col w-full">
                <span className="font-medium text-sm mb-1 tracking-wide">
                  MISSING CHANNELS
                </span>
                <span className="text-sm">
                  Some cart items have channels that no longer exist. Please
                  review and update these items. If this order is created, these
                  cart items will not be created.
                </span>
                {invalidCartItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-1 border shadow-sm mt-2 flex items-center space-x-2 bg-background"
                  >
                    {item.image && (
                      <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {item.channel?.name || "Unknown Channel"}
                      </div>
                      <div className="text-sm truncate">{item.name}</div>
                      <div className="text-xs truncate">
                        {item.productId} | {item.variantId}
                      </div>
                      <div className="text-sm font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Badge>
          </div>
        )}
        {validCartItems.length > 0 ? (
          <div className="space-y-2 p-2">
            {validCartItems.map((item, index) => (
              <CartItemField
                key={item.id || index}
                {...item}
                index={index}
                onRemove={() => {
                  setLocalState((prevState) => ({
                    ...prevState,
                    cartItems: prevState.cartItems.filter(
                      (_, i) => i !== index
                    ),
                  }));
                }}
                onQuantityChange={(newQuantity) => {
                  setLocalState((prevState) => ({
                    ...prevState,
                    cartItems: prevState.cartItems.map((cartItem, i) =>
                      i === index
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
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
            placeholder="Search channel products..."
            className="mb-2"
            onKeyPress={handleSearch}
          />
          <Select
            value={selectedChannelId}
            onValueChange={setSelectedChannelId}
            className="mb-2"
          >
            <SelectTrigger className="text-base shadow-sm">
              <SelectValue placeholder="Select a channel" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && <div>Loading...</div>}
          {error && <div>Error: {error.message}</div>}
          {data?.searchChannelProducts && (
            <div className="space-y-2 mt-2 overflow-y-auto w-full">
              {data.searchChannelProducts.map((product) => (
                <div
                  key={product.productId}
                  className="border flex items-center space-x-2 p-2 rounded-md bg-muted/40"
                >
                  <div className="border w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{product.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.productId} | {product.variantId}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="text-sm font-semibold">
                        $
                        {(
                          parseFloat(product.price) *
                          (quantities[product.productId] || 1)
                        ).toFixed(2)}
                        {(quantities[product.productId] || 1) > 1 && (
                          <span className="font-normal text-muted-foreground ml-2">
                            (${parseFloat(product.price).toFixed(2)} x{" "}
                            {quantities[product.productId] || 1})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <BadgeButton
                          size="sm"
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
                              (quantities[product.productId] || 1).toString()
                                .length * 0.75
                            )}em`,
                          }}
                          type="text"
                          value={quantities[product.productId] || 1}
                          onChange={(e) =>
                            handleQuantityInputChange(
                              product.productId,
                              e.target.value
                            )
                          }
                          onBlur={() => handleQuantityBlur(product.productId)}
                          onKeyDown={(e) =>
                            handleQuantityKeyDown(e, product.productId)
                          }
                        />
                        <BadgeButton
                          size="sm"
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
                        <BadgeButton
                          size="sm"
                          color="teal"
                          onClick={() => handleAddItem(product)}
                          className="px-1"
                        >
                          <Plus className="h-4 w-4" />
                        </BadgeButton>
                      </div>
                    </div>
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
