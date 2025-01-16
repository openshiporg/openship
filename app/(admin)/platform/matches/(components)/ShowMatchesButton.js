import React from "react";
import { useQuery, gql } from "@apollo/client";
import { Button } from "@ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/sheet";
import { MatchCard } from "./MatchCard";
import { Badge } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import { Card } from "@keystone/themes/Tailwind/orion/primitives/default/ui/card";

const GET_MATCHES_COUNT = gql`
  query GetMatchesCount($where: MatchWhereInput!) {
    matchesCount(where: $where)
  }
`;

const GET_MATCHES = gql`
  query GetMatches($where: MatchWhereInput!) {
    matches(where: $where) {
      id
      input {
        id
        quantity
        productId
        variantId
        externalDetails {
          title
          image
          price
          inventory
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
        externalDetails {
          title
          image
          price
          inventory
        }
        channel {
          id
          name
        }
        priceChanged
      }
      outputPriceChanged
      inventoryNeedsToBeSynced {
        syncEligible
        sourceQuantity
        targetQuantity
      }
    }
  }
`;

export const ShowMatchesButton = ({ product, onMatchAction }) => {
  const whereClause = {
    AND: [
      {
        input: {
          some: {
            productId: { equals: product.productId },
            variantId: { equals: product.variantId },
          },
        },
      },
    ],
  };

  const { data: countData, loading: countLoading } = useQuery(
    GET_MATCHES_COUNT,
    {
      variables: { where: whereClause },
    }
  );

  const {
    data: matchesData,
    loading: matchesLoading,
    refetch,
  } = useQuery(GET_MATCHES, {
    variables: { where: whereClause },
  });

  const handleSheetOpen = () => {
    refetch();
  };

  return (
    <Sheet onOpenChange={handleSheetOpen}>
      <SheetTrigger>
        <Button
          className="text-nowrap cursor-pointer text-xs border font-medium uppercase tracking-wide py-0.5 px-1.5"
          variant="secondary"
          size="xs"
          isLoading={countLoading}
          disabled={countData?.matchesCount === 0}
        >
          {countData?.matchesCount}
          {" "}Match{countData?.matchesCount !== 1 && "es"}
        </Button>

        {/* <Badge
          color="zinc"
          className="uppercase tracking-wide border flex items-center gap-2 text-[.825rem] py-0.5 px-2 font-medium"
        >
          Matches
          {!countLoading && countData && (
            <Badge color="zinc"className="border py-0.5 px-1.5 text-xs">
              {countData.matchesCount}
            </Badge>
          )}
        </Badge> */}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Item Matches</SheetTitle>
          <Card className="p-2 bg-muted/40">
            <div className="flex space-x-2">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title}
                  className="border w-16 h-16 object-cover rounded-md"
                />
              )}
              <div className="flex-grow">
                <div className="text-sm font-medium">{product.title}</div>
                <div className="text-xs text-gray-500">
                  {product.productId} | {product.variantId}
                </div>
                <div className="text-sm font-medium">${product.price}</div>
              </div>
            </div>
          </Card>
        </SheetHeader>
        <div className="text-muted-foreground px-6 py-2 font-medium uppercase tracking-wider text-sm">
          {matchesData?.matches?.length} match
          {matchesData?.matches?.length > 1 ? "es" : ""} found
        </div>
        <div className="border-y space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          {matchesLoading ? (
            <div>Loading matches...</div>
          ) : matchesData?.matches?.length > 0 ? (
            matchesData.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onMatchAction={onMatchAction}
              />
            ))
          ) : (
            <>No Matches Found</>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
