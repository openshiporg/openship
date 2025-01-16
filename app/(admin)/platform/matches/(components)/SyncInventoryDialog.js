"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@ui/dialog";
import { Button, buttonVariants } from "@ui/button";
import { Input } from "@ui/input";
import { Badge, BadgeButton } from "@ui/badge";
import { Plus, X, ChevronRight } from "lucide-react";
import { cn } from "@keystone/utils/cn";
import { RiLoader2Fill } from "@remixicon/react";
import {
  gql,
  useApolloClient,
  useMutation,
  useQuery,
} from "@keystone-6/core/admin-ui/apollo";
import { MatchCard } from "./MatchCard";

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
          error
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
          error
        }
        price
        priceChanged
        channel {
          id
          name
        }
      }
      createdAt
      outputPriceChanged
      inventoryNeedsToBeSynced {
        syncEligible
        sourceQuantity
        targetQuantity
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

export const SyncInventoryDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchEntry, setSearchEntry] = useState("");
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [removedMatches, setRemovedMatches] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingMatchIds, setSyncingMatchIds] = useState(new Set());

  const { data, loading, error } = useQuery(FETCH_FILTERED_MATCHES_QUERY);
  const [updateShopProduct] = useMutation(UPDATE_SHOP_PRODUCT_MUTATION);
  const client = useApolloClient();

  const filteredMatches = useMemo(() => {
    if (!data?.getFilteredMatches) return [];
    return data.getFilteredMatches.filter((match) =>
      match.input[0].externalDetails.title
        .toLowerCase()
        .includes(searchEntry.toLowerCase())
    );
  }, [data, searchEntry]);

  const syncableMatches = useMemo(() => {
    return filteredMatches.filter(
      (match) => match.inventoryNeedsToBeSynced.syncEligible
    );
  }, [filteredMatches]);

  useEffect(() => {
    if (data?.getFilteredMatches) {
      setSelectedMatches(data.getFilteredMatches.map((match) => match.id));
    }
  }, [data]);

  const handleRemoveMatch = (matchId) => {
    setSelectedMatches((prev) => prev.filter((id) => id !== matchId));
    setRemovedMatches((prev) => [...prev, matchId]);
  };

  const handleAddMatch = (matchId) => {
    setSelectedMatches((prev) => [...prev, matchId]);
    setRemovedMatches((prev) => prev.filter((id) => id !== matchId));
  };

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    const syncingIds = new Set(syncingMatchIds);

    for (const match of filteredMatches) {
      if (selectedMatches.includes(match.id)) {
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
        } catch (err) {
          console.error(
            `Error updating shop product for match ${match.id}:`,
            err
          );
        }
      }
    }
    await client.refetchQueries({
      include: "active",
    });
    setSyncingMatchIds(new Set());
    setIsSyncing(false);
    setIsOpen(false);
  };

  const handleSearch = () => {
    const searchResults = filteredMatches.map((match) => match.id);
    setSelectedMatches(searchResults);
    setRemovedMatches(
      data.getFilteredMatches
        .filter((match) => !searchResults.includes(match.id))
        .map((match) => match.id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="py-1">
          Sync Inventory
          <span className="ml-2 bg-primary text-primary-foreground rounded-md w-4 h-4 flex items-center justify-center text-xs">
            {syncableMatches.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sync Inventory</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search matches..."
              className="input pr-10"
              value={searchEntry}
              onChange={(e) => setSearchEntry(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <div className="absolute right-2 top-2">
              <BadgeButton
                onClick={handleSearch}
                className="border text-xs py-0.5 uppercase tracking-wide font-medium"
              >
                Search
              </BadgeButton>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
          <details open className="p-4 border rounded-lg bg-muted group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <div
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "self-start p-1 transition-transform group-open:rotate-90"
                  )}
                >
                  <ChevronRight className="size-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    <text className="relative text-lg/5 font-medium">
                      Matches to Sync
                    </text>
                    <div>
                      <Badge className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium">
                        {selectedMatches.length} MATCH
                        {selectedMatches.length !== 1 ? "ES" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh]">
              {filteredMatches
                .filter((match) => selectedMatches.includes(match.id))
                .map((match) => (
                  <div
                    key={match.id}
                    className="border rounded-lg relative mt-2 bg-background ml-8"
                  >
                    <MatchCard
                      match={match}
                      renderButtons={() => (
                        <div className="flex gap-2">
                          <BadgeButton
                            color="rose"
                            onClick={() => handleRemoveMatch(match.id)}
                            className="border p-1.5 rounded-md shadow-sm"
                          >
                            <X className="h-3.5 w-3.5" />
                          </BadgeButton>
                        </div>
                      )}
                      updateShopProductLoading={syncingMatchIds.has(match.id)}
                    />
                  </div>
                ))}
            </div>
          </details>

          <details open className="p-4 border rounded-lg bg-muted group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <div
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "self-start p-1 transition-transform group-open:rotate-90"
                  )}
                >
                  <ChevronRight className="size-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    <text className="relative text-lg/5 font-medium">
                      Removed Matches
                    </text>
                    <div>
                      <Badge
                        className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
                        color="red"
                      >
                        {removedMatches.length} MATCH
                        {removedMatches.length !== 1 ? "ES" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh]">
              {filteredMatches
                .filter((match) => removedMatches.includes(match.id))
                .map((match) => (
                  <div
                    key={match.id}
                    className="border rounded-lg opacity-75 mt-2 bg-background ml-8"
                  >
                    <MatchCard
                      match={match}
                      renderButtons={() => (
                        <BadgeButton
                          color="emerald"
                          onClick={() => handleAddMatch(match.id)}
                          className="border p-1.5 rounded-md shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </BadgeButton>
                      )}
                    />
                  </div>
                ))}
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleSyncInventory}
            disabled={selectedMatches.length === 0 || isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Inventory"}
            <Badge className="ml-2 border py-0.5 px-1.5">
              {selectedMatches.length}
            </Badge>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
