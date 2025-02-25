import React from "react";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { OrderDetailsComponent } from "./OrderDetailsComponent";
import { LoadingIcon } from "@keystone/themes/Tailwind/orion/components/LoadingIcon";
import { CreateButtonLink } from "@keystone/themes/Tailwind/orion/components/CreateButtonLink";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import { Triangle, Circle, Square, PlusIcon } from "lucide-react";
import { Skeleton } from "@keystone/themes/Tailwind/orion/primitives/default/ui/skeleton";
import { RiBarChartFill } from "@remixicon/react";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";

export const OrdersTable = ({
  data,
  error,
  listKey,
  list,
  handleOrderAction,
  openEditDrawer,
  channels,
  loadingActions,
  query,
  filters,
  searchParam,
  updateSearchString,
  push,
  showCreate,
  statusColors,
}) => {
  if (!data) {
    return <Skeleton className="w-full h-20" />;
  }

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data.items?.length) {
    return (
      <div>
        <div className="flex flex-col items-center p-10 border-dashed border-2 rounded-lg m-5">
          <div className="flex opacity-40">
            <RiBarChartFill
              className="mx-auto h-7 w-7 text-muted-foreground"
              aria-hidden={true}
            />
          </div>
          {query.search || filters?.filters?.length ? (
            <>
              <span className="pt-4 font-medium text-foreground">
                No <span className="lowercase"> {list.label} </span> found
              </span>
              <span className="text-sm text-muted-foreground pb-4">
                {query.search
                  ? `No orders matching your search`
                  : `No orders matching your filters`}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  updateSearchString?.("");
                  const path = window.location.pathname;
                  push?.(path);
                }}
              >
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <span className="pt-4 font-medium text-foreground">
                No orders found
              </span>
              <span className="text-sm text-muted-foreground pb-4">
                Orders will appear here once they're created or imported from your shops
              </span>
              {showCreate && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="outline"
                    onClick={() => document.querySelector('[aria-label="Create Order"]')?.click()}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                  <Button
                    onClick={() => document.querySelector('[aria-label="Import Order"]')?.click()}
                  >
                    <ArrowPathRoundedSquareIcon className="mr-2 h-4 w-4" />
                    Import Order
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 divide-y">
      {dataGetter.get("items").data.map((order) => (
        <OrderDetailsComponent
          key={order.id}
          order={{
            ...order,
            date: new Date(order.createdAt).toLocaleString(),
          }}
          shopId={order.shop?.id}
          onOrderAction={handleOrderAction}
          openEditDrawer={openEditDrawer}
          channels={channels}
          loadingActions={loadingActions}
          statusColors={statusColors}
        />
      ))}
    </div>
  );
};