"use client";

import React, { useState } from "react";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui/card";
import { Separator } from "@keystone/themes/KeystoneUI/primitives/default/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/collapsible";
import { Button } from "@ui/button";
import {
  AlertTriangle,
  Box,
  CheckCircle,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  Loader,
  Loader2,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
} from "@ui/avatar";
import { Skeleton } from "@keystone/themes/KeystoneUI/primitives/default/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@keystone/themes/KeystoneUI/primitives/default/ui/dialog";

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
        externalDetails {
          title
          image
          price
          productLink
          inventory
          inventoryTracked
        }
        shop {
          id
          name
        }
      }
      output {
        id
        quantity
        productId
        variantId
        lineItemId
        externalDetails {
          title
          image
          price
          productLink
          inventory
          inventoryTracked
        }
        price
        channel {
          id
          name
        }
      }
    }
  }
`;

const FETCH_FILTERED_MATCHES_QUERY = gql`
  query FETCH_FILTERED_MATCHES_QUERY {
    getFilteredMatches {
      id
      input {
        id
        quantity
        productId
        variantId
        lineItemId
        externalDetails {
          title
          image
          price
          productLink
          inventory
          inventoryTracked
        }
        shop {
          id
          name
        }
      }
      output {
        id
        quantity
        productId
        variantId
        lineItemId
        externalDetails {
          title
          image
          price
          productLink
          inventory
          inventoryTracked
        }
        price
        channel {
          id
          name
        }
      }
    }
  }
`;

const UPDATE_SHOP_PRODUCT_MUTATION = gql`
  mutation UpdateShopProduct(
    $shopId: ID!
    $variantId: ID!
    $productId: ID!
    $inventoryDelta: Int
  ) {
    updateShopProduct(
      shopId: $shopId
      variantId: $variantId
      productId: $productId
      inventoryDelta: $inventoryDelta
    ) {
      error
      success
      updatedVariant {
        inventory
      }
    }
  }
`;

const MatchHeader = ({
  match,
  children,
  defaultOpen = false,
  isLoading = false,
  isSynced = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex p-3 bg-muted/30">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium text-slate-500 bg-white border-slate-200 hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-blue-700 focus:text-slate-700 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 dark:focus:ring-blue-500 dark:focus:text-white"
          >
            {match.id}
            <ChevronRight className="h-4 w-4" />
          </button>
        </CollapsibleTrigger>
        {match.input.length === 1 && match.output.length === 1 && (
          <Button
            variant="secondary"
            className="ml-auto text-muted-foreground py-0"
          >
            <span>{match.input[0].externalDetails.inventory}</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>{match.output[0].externalDetails.inventory}</span>
          </Button>
        )}
        {isLoading ? (
          <Loader2 className="mt-0.5 ml-2 animate-spin text-blue-600" />
        ) : isSynced ? (
          <CircleCheck className="mt-0.5 h-5.5 w-5.5 ml-2 text-green-600" />
        ) : null}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

const SyncDialog = () => {
  const { data, loading, error } = useQuery(FETCH_FILTERED_MATCHES_QUERY);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingMatchIds, setSyncingMatchIds] = useState(new Set());
  const [syncedMatchIds, setSyncedMatchIds] = useState(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updateShopProduct] = useMutation(UPDATE_SHOP_PRODUCT_MUTATION);

  const updateProducts = async () => {
    if (!data?.getFilteredMatches) return;

    setIsSyncing(true);
    const syncingIds = new Set(syncingMatchIds);
    const syncedIds = new Set(syncedMatchIds);

    for (const match of data.getFilteredMatches) {
      const input = match.input[0];
      const output = match.output[0];
      syncingIds.add(match.id);
      setSyncingMatchIds(new Set(syncingIds));

      try {
        await updateShopProduct({
          variables: {
            shopId: input.shop.id,
            variantId: input.variantId,
            productId: input.productId,
            inventoryDelta:
              output.externalDetails.inventory -
              input.externalDetails.inventory,
          },
        });
        syncedIds.add(match.id);
      } catch (err) {
        console.error(
          `Error updating shop product for match ${match.id}:`,
          err
        );
      }
    }

    setSyncingMatchIds(new Set());
    setSyncedMatchIds(new Set(syncedIds));
    setIsSyncing(false);
  };

  const handleConfirm = async () => {
    await updateProducts();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger className="ml-auto">
        <Button onClick={() => setIsDialogOpen(true)}>Sync Inventory</Button>
      </DialogTrigger>
      {isDialogOpen && (
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sync Inventory</DialogTitle>
            <DialogDescription>
              Confirm syncing inventory data
              {data?.getFilteredMatches?.length &&
                ` for ${data?.getFilteredMatches?.length} match${
                  data?.getFilteredMatches?.length > 1 ? "es" : ""
                }`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {error ? (
              <p>Error: {error.message}</p>
            ) : loading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="animate-pulse">
                  <Card>
                    <div className="p-3 bg-muted/30">
                      <Skeleton className="h-6 w-1/4" />
                    </div>
                    <Separator />
                    <div className="p-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-full mt-4" />
                    </div>
                  </Card>
                </div>
              ))
            ) : (
              data.getFilteredMatches.map((match) => (
                <div key={match.id}>
                  <Card>
                    <MatchHeader
                      match={match}
                      isLoading={syncingMatchIds.has(match.id)}
                      isSynced={syncedMatchIds.has(match.id)}
                    >
                      <Separator />
                      <ProductDetailsCollapsible
                        items={match.input}
                        title="Shop Product"
                      />
                      <Separator />
                      <ProductDetailsCollapsible
                        items={match.output}
                        title="Channel Product"
                      />
                    </MatchHeader>
                  </Card>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSyncing}>
              {isSyncing ? "Syncing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

const MatchesComponent = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data, loading, error } = useQuery(FETCH_MATCHES_QUERY);

  if (error) return <p>Error fetching matches: {error.message}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <div className="flex-col items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Matches</h1>
          <p className="text-muted-foreground">
            <span>Sync inventory based on matches</span>
          </p>
        </div>
        <SyncDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 pb-12">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <Card>
                  <div className="p-3 bg-muted/30">
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                  <Separator />
                  <div className="p-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-full mt-4" />
                  </div>
                </Card>
              </div>
            ))
          : data.matches.map((match) => (
              <div key={match.id}>
                <Card>
                  <MatchHeader match={match}>
                    <Separator />
                    <ProductDetailsCollapsible
                      items={match.input}
                      title="Shop Product"
                    />
                    <Separator />
                    <ProductDetailsCollapsible
                      items={match.output}
                      title="Channel Product"
                    />
                  </MatchHeader>
                </Card>
              </div>
            ))}
      </div>
    </div>
  );
};

const ProductDetailsCollapsible = ({ items, title, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const isShopProduct = title === "Shop Product";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col gap-2 p-3 ${
        isShopProduct
          ? "bg-green-50/40 dark:bg-emerald-900/20"
          : "bg-blue-50/30 dark:bg-indigo-900/10"
      }`}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`flex items-center rounded-sm shadow-sm uppercase tracking-wide border max-w-fit gap-2 text-nowrap pl-2.5 pr-1 py-[3px] text-sm font-medium ${
            isShopProduct
              ? "text-emerald-500 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-blue-500 dark:focus:text-white"
              : "text-blue-500 bg-white border-blue-200 hover:bg-blue-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:text-white"
          }`}
        >
          {items.length} {title}
          {items.length > 1 && "s"}
          <ChevronsUpDown className="h-4 w-4" />
        </button>
        {/* {isShopProduct ? (
          <div>
            <Badge
              color="emerald"
              className="bg-white text-sm uppercase tracking-wide rounded-sm"
            >
              {items.length} {title}
              {items.length > 1 && "s"}
              <ChevronsUpDown className="h-4 w-4" />
            </Badge>
          </div>
        ) : (
          <div>
            <Badge
              color="indigo"
              className="bg-opacity-5 text-sm uppercase tracking-wide rounded-sm"
            >
              {items.length} {title}
              {items.length > 1 && "s"}
              <ChevronsUpDown className="h-4 w-4" />
            </Badge>
          </div>
        )} */}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id + "-details-" + index}
            className="border p-2 bg-background rounded-sm flex items-center gap-4"
          >
            <Avatar className="border rounded-sm h-12 w-12">
              <AvatarImage
                src={item.externalDetails.image}
                alt={item.externalDetails.title}
              />
            </Avatar>
            <div className="grid">
              <div className="uppercase font-normal tracking-wide text-xs text-muted-foreground">
                {item.shop?.name || item.channel?.name}
              </div>
              <p className="text-sm font-medium">
                {item.externalDetails.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.productId} | {item.variantId}
              </p>
              {/* <p className="text-sm font-medium">
                ${item.externalDetails.price}
              </p> */}
              {/* <p className="text-sm dark:text-emerald-500 font-medium">
                  ${parseFloat(item.externalDetails.price).toFixed(2)}
                </p> */}
              {item.quantity > 1 ? (
                <div className="flex gap-2 items-center">
                  <p className="text-sm dark:text-emerald-500 font-medium">
                    ${(
                      parseFloat(item.externalDetails.price) * item.quantity
                    ).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    (${parseFloat(item.externalDetails.price).toFixed(2)} x{" "}
                    {item.quantity})
                  </p>
                </div>
              ) : (
                <p className="text-sm dark:text-emerald-500 font-medium">
                  ${parseFloat(item.externalDetails.price).toFixed(2)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 pt-1 items-center mb-auto ml-auto shadow-xs uppercase tracking-wide border text-nowrap px-2 py-[2px] text-xs font-medium text-slate-500 bg-white border-slate-200 rounded-sm hover:bg-slate-100 hover:text-slate-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-slate-700 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 dark:focus:ring-blue-500 dark:focus:text-white">
              {!item.externalDetails.inventoryTracked ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Box className="w-3 h-3" strokeWidth={2.5} />
              )}
              <span className="text-center">
                {item.externalDetails.inventory !== null
                  ? item.externalDetails.inventory >= 1e9
                    ? `${(item.externalDetails.inventory / 1e9).toFixed(1)}B`
                    : item.externalDetails.inventory >= 1e6
                    ? `${(item.externalDetails.inventory / 1e6).toFixed(1)}M`
                    : item.externalDetails.inventory >= 1e3
                    ? `${(item.externalDetails.inventory / 1e3).toFixed(1)}k`
                    : item.externalDetails.inventory.toString()
                  : "N/A"}
              </span>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MatchesComponent;
