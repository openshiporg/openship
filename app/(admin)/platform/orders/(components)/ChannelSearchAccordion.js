// components/ChannelSearchAccordion.js
import React, { useState } from "react";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/collapsible";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/select";
import { Input } from "@keystone/themes/Tailwind/orion/primitives/default/ui/input";
import { BadgeButton } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { ChevronsUpDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";

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

export const ChannelSearchAccordion = ({ channels, onAddItem }) => {
  const [searchEntry, setSearchEntry] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [localQuantities, setLocalQuantities] = useState({});

  const { data, loading, error } = useQuery(SEARCH_CHANNEL_PRODUCTS, {
    variables: { channelId: selectedChannelId, searchEntry },
    skip: !selectedChannelId || !searchEntry,
  });

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchEntry(e.target.value);
    }
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

  const handleAddItem = (product) => {
    const quantity = quantities[product.productId] || 1;
    onAddItem({ ...product, quantity }, selectedChannelId);
    setQuantities({ ...quantities, [product.productId]: 1 });
    setLocalQuantities({ ...localQuantities, [product.productId]: 1 });
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-t border-b flex flex-col gap-2 p-3 bg-emerald-50/40 dark:bg-emerald-900/20"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-emerald-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-emerald-500 dark:focus:text-white"
        >
          Channel Search
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
          <SelectTrigger className="w-full">
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
        <Input
          placeholder="Search channel products..."
          value={searchEntry}
          onChange={(e) => setSearchEntry(e.target.value)}
          onKeyPress={handleSearch}
        />
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error.message}</div>}
        {data?.searchChannelProducts && (
          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
            {data.searchChannelProducts.map((product) => (
              <div
                key={product.productId}
                className="flex items-center space-x-2 p-2 bg-background rounded-md border"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium truncate">
                    {product.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.productId} | {product.variantId}
                  </div>
                  {(quantities[product.productId] || 1) > 1 ? (
                    <div className="flex gap-2 items-center">
                      <p className="text-sm dark:text-emerald-500 font-medium">
                        $
                        {(
                          parseFloat(product.price) *
                          (quantities[product.productId] || 1)
                        ).toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        (${parseFloat(product.price).toFixed(2)} x{" "}
                        {quantities[product.productId] || 1})
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm dark:text-emerald-500 font-medium">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <div className="flex items-center space-x-1">
                    <BadgeButton
                      onClick={() =>
                        handleQuantityChange(
                          product.productId,
                          Math.max(1, (quantities[product.productId] || 1) - 1)
                        )
                      }
                      className="border px-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
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
                      className="border px-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </BadgeButton>
                  </div>
                  <BadgeButton
                    onClick={() => handleAddItem(product)}
                    color="indigo"
                    className="border px-1"
                  >
                    <Plus className="h-3 w-3" />
                  </BadgeButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
