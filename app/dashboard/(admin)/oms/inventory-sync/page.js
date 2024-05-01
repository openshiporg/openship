"use client";

import React from "react";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@keystone/primitives/default/ui/card";
import { Input } from "@keystone/primitives/default/ui/input";
import { Label } from "@keystone/primitives/default/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@keystone/components/Select";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@keystone/primitives/default/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@keystone/primitives/default/ui/collapsible";
import { Button } from "@keystone/primitives/default/ui/button";
import { AlertTriangle, Box, Boxes, ChevronsUpDown } from "lucide-react";
import { Separator } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/separator";

// GraphQL query to fetch initial matches and include shopId and channelId
const FETCH_MATCHES_QUERY = gql`
  query FETCH_MATCHES_QUERY {
    matches {
      id
      input {
        id
        quantity
        productId
        variantId
        lineItemId
        shop {
          id
        }
      }
      output {
        id
        quantity
        productId
        variantId
        lineItemId
        price
        channel {
          id
        }
      }
    }
  }
`;

// Queries for searching products in shops and channels
const SEARCH_SHOP_PRODUCTS_QUERY = gql`
  query searchShopProducts(
    $shopId: ID!
    $productId: String
    $variantId: String
  ) {
    searchShopProducts(
      shopId: $shopId
      productId: $productId
      variantId: $variantId
    ) {
      title
      image
      price
      productLink
      productId
      variantId
      inventory
      inventoryTracked
    }
  }
`;

const SEARCH_CHANNEL_PRODUCTS_QUERY = gql`
  query searchChannelProducts(
    $channelId: ID!
    $productId: String
    $variantId: String
  ) {
    searchChannelProducts(
      channelId: $channelId
      productId: $productId
      variantId: $variantId
    ) {
      title
      image
      price
      productLink
      productId
      variantId
      inventory
      inventoryTracked
    }
  }
`;

// New component for InputProductDetailsCollapsible
const InputProductDetailsCollapsible = ({ inputItems }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 p-3 bg-green-50/40 dark:bg-emerald-900/20"
    >
      <div className="flex items-center justify-between">
        {/* <h4 className="text-base font-semibold mb-3 text-muted-foreground">
          Shop Products
        </h4> */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="shadow-sm uppercase tracking-wide border flex items-center gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-emerald-500 bg-white border-emerald-200 rounded-sm hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            <span>
              {inputItems.length} Shop Product{inputItems.length !== 1 && "s"}
            </span>
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        {inputItems.map((inputItem, index) => (
          <InputProductDetails
            key={inputItem.id + "-input-" + index}
            item={inputItem}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// New component for OutputProductDetailsCollapsible
const OutputProductDetailsCollapsible = ({ outputItems }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 p-3 bg-blue-50/30 dark:bg-indigo-900/10"
    >
      <div className="flex items-center justify-between">
        {/* <h4 className="text-base font-semibold mb-3 text-muted-foreground">
          Channel Products
        </h4> */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="shadow-sm uppercase tracking-wide border flex items-center gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-blue-500 bg-white border-blue-200 rounded-sm hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            <span>
              {outputItems.length} Channel Product
              {outputItems.length !== 1 && "s"}
            </span>
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        {outputItems.map((outputItem, index) => (
          <OutputProductDetails
            key={outputItem.id + "-output-" + index}
            item={outputItem}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Update the MatchesComponent to use the new components
const MatchesComponent = () => {
  const { data, loading, error } = useQuery(FETCH_MATCHES_QUERY);

  if (loading) return <p>Loading matches...</p>;
  if (error) return <p>Error fetching matches: {error.message}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-col items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Inventory Sync</h1>
        <p className="text-muted-foreground">
          <span>Sync inventory based on matches</span>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 pb-12">
        {data.matches.map((match) => (
          <Card key={match.id}>
            <div className="p-3 bg-muted/30">
              <div className="uppercase font-normal tracking-wide text-sm">
                Match
              </div>
              <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                {match.id}
              </div>
            </div>
            <Separator />

            <div className="flex flex-col">
              <InputProductDetailsCollapsible inputItems={match.input} />
              <Separator />
              <OutputProductDetailsCollapsible outputItems={match.output} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const InputProductDetails = ({ item }) => {
  const { data, loading, error } = useQuery(SEARCH_SHOP_PRODUCTS_QUERY, {
    variables: {
      shopId: item.shop.id,
      productId: item.productId,
      variantId: item.variantId,
    },
  });

  return (
    <ProductDetails item={item} data={data} loading={loading} error={error} />
  );
};

const OutputProductDetails = ({ item }) => {
  const { data, loading, error } = useQuery(SEARCH_CHANNEL_PRODUCTS_QUERY, {
    variables: {
      channelId: item.channel.id,
      productId: item.productId,
      variantId: item.variantId,
    },
  });

  return (
    <ProductDetails item={item} data={data} loading={loading} error={error} />
  );
};

const ProductDetails = ({ item, data, loading, error }) => {
  if (loading) return <p>Loading product details...</p>;
  if (error) return <p>Error loading product details: {error.message}</p>;

  const productDetails =
    data?.searchShopProducts || data?.searchChannelProducts;

  return productDetails ? (
    <div className="border p-2 bg-background rounded-sm flex items-center gap-4">
      <Avatar className="border rounded-sm hidden h-12 w-12 sm:flex">
        <AvatarImage
          src={productDetails[0].image}
          alt={productDetails[0].title}
        />
      </Avatar>
      <div className="grid">
        <p className="text-sm font-medium leading-none">
          {productDetails[0].title}
        </p>
        <p className="text-sm text-muted-foreground">
          {productDetails[0].productId} | {productDetails[0].variantId}
        </p>
        <p className="text-sm dark:text-emerald-500 font-medium">
          ${parseFloat(productDetails[0].price).toFixed(2)}
        </p>
        {item.quantity > 1 && (
          <p className="text-xs text-gray-500">
            ${parseFloat(productDetails[0].price).toFixed(2)} x {item.quantity}{" "}
            = $
            {(parseFloat(productDetails[0].price) * item.quantity).toFixed(2)}
          </p>
        )}
      </div>
      <div className="flex mb-auto ml-auto shadow-xs uppercase tracking-wide border items-center gap-2 text-nowrap px-2 py-[2px] text-xs font-medium text-slate-500 bg-white border-slate-200 rounded-sm hover:bg-slate-100 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-slate-700 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 dark:focus:ring-blue-500 dark:focus:text-white">
        <Box className="w-3 h-3" strokeWidth={2.5}/>
        <span>{productDetails[0].inventory}</span>
        {!productDetails[0].inventoryTracked && <AlertTriangle />}
      </div>
    </div>
  ) : null;
};

export default MatchesComponent;
