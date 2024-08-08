import React, { useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { gql } from "@apollo/client";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import { BadgeButton } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Input } from "@ui/input";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1">
          <Button
            variant="secondary"
            onClick={handlePreviousPage}
            disabled={skip === 0}
            className="h-10 px-2.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            onClick={handleNextPage}
            disabled={orders.length < pageSize}
            className="h-10 px-2.5"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search orders..."
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
              variant="secondary"
              onClick={handleSearch}
              className="border h-6 py-1 uppercase text-xs font-medium tracking-wider"
            >
              Search
            </BadgeButton>
          </div>
        </div>
      </div>
      {orders.map((order) => (
        <div key={order.id} className="mb-4 p-4 border rounded">
          <h3 className="font-bold">{order.orderName}</h3>
          <p>
            {order.firstName} {order.lastName}
          </p>
          <p>
            {order.streetAddress1} {order.streetAddress2}
          </p>
          <p>
            {order.city}, {order.state} {order.zip}
          </p>
          <p>Created: {new Date(order.createdAt).toLocaleString()}</p>
          <p>
            Total: {order.currency} {order.totalPrice}
          </p>
          <p>Status: {order.status}</p>
          <h4 className="font-semibold mt-2">Cart Items:</h4>
          <ul className="list-disc pl-5">
            {order.cartItems.map((item) => (
              <li key={item.id}>
                {item.name} - Quantity: {item.quantity}, Price: {order.currency}{" "}
                {item.price}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {orders.length === 0 && (
        <p className="text-center text-gray-500">No orders found.</p>
      )}
    </div>
  );
};
