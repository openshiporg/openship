import React, { useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { gql } from "@apollo/client";
import { Button } from "@ui/button";
import { Badge } from "@ui/badge";
import { Input } from "@ui/input";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { OrderDetailsComponent } from "../../orders/(components)/OrderDetailsComponent";

export const CHANNEL_ORDERS_QUERY = gql`
  query CHANNEL_ORDERS_QUERY(
    $skip: Int
    $take: Int
    $where: OrderWhereInput
    $cartItemsWhere: CartItemWhereInput
  ) {
    orders(orderBy: [], take: $take, skip: $skip, where: $where) {
      id
      orderId
      orderName
      email
      firstName
      lastName
      streetAddress1
      streetAddress2
      city
      state
      zip
      orderError
      cartItems(where: $cartItemsWhere) {
        id
        name
        image
        price
        quantity
        productId
        variantId
        purchaseId
        url
        error
        order {
          id
        }
        channel {
          id
          name
        }
      }
      shop {
        name
        domain
        accessToken
      }
      currency
      totalPrice
      subTotalPrice
      totalDiscount
      totalTax
      status
      createdAt
      cartItemsCount
      lineItemsCount
    }
  }
`;

export const SearchOrders = ({
  channelId,
  searchEntry: initialSearchEntry,
  pageSize,
}) => {
  const [searchEntry, setSearchEntry] = useState(initialSearchEntry);
  const [skip, setSkip] = useState(0);

  const { data, error, loading } = useQuery(CHANNEL_ORDERS_QUERY, {
    variables: {
      where: {
        cartItems: {
          some: { channel: { id: { equals: channelId } } },
        },
        OR: [
          { orderName: { contains: searchEntry, mode: "insensitive" } },
          { firstName: { contains: searchEntry, mode: "insensitive" } },
          { lastName: { contains: searchEntry, mode: "insensitive" } },
          { streetAddress1: { contains: searchEntry, mode: "insensitive" } },
          { streetAddress2: { contains: searchEntry, mode: "insensitive" } },
          { city: { contains: searchEntry, mode: "insensitive" } },
          { state: { contains: searchEntry, mode: "insensitive" } },
          { zip: { contains: searchEntry, mode: "insensitive" } },
        ],
      },
      cartItemsWhere: { channel: { id: { equals: channelId } } },
      skip: skip,
      take: pageSize,
    },
  });

  const handleSearch = () => {
    setSkip(0);
  };

  const handleNextPage = () => {
    setSkip(skip + pageSize);
  };

  const handlePreviousPage = () => {
    setSkip(Math.max(0, skip - pageSize));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const orders = data?.orders || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={skip === 0}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={orders.length < pageSize}
            className="h-8 w-8"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full rounded-md bg-muted/40 pl-9"
            placeholder="Search orders..."
            type="text"
            value={searchEntry}
            onChange={(e) => setSearchEntry(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
      </div>

      <div className="divide-y border rounded-lg overflow-hidden">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderDetailsComponent
              key={order.id}
              order={{
                ...order,
                date: new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              }}
              shopId={order.shop?.id}
              onOrderAction={() => {}}
              openEditDrawer={() => {}}
              channels={[]}
              loadingActions={{}}
              removeEditItemButton={true}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};
