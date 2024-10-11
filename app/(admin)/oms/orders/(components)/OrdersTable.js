import React from "react";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { OrderDetailsComponent } from "./OrderDetailsComponent";
import { LoadingIcon } from "@keystone/themes/Tailwind/atlas/components/LoadingIcon";
import { CreateButtonLink } from "@keystone/themes/Tailwind/atlas/components/CreateButtonLink";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import { Triangle, Circle, Square } from "lucide-react";
import { Skeleton } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/skeleton";

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
            <Triangle className="w-8 h-8 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950" />
            <Circle className="w-8 h-8 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
            <Square className="w-8 h-8 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950" />
          </div>
          {query.search || filters.filters.length ? (
            <>
              <span className="pt-4 font-semibold">
                No <span className="lowercase"> {list.label} </span>{" "}
              </span>
              <span className="text-muted-foreground pb-4">
                Found{" "}
                {searchParam
                  ? `matching your search`
                  : `matching your filters`}{" "}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  updateSearchString("");
                  const path = window.location.pathname;
                  push(path);
                }}
              >
                Clear filters &amp; search
              </Button>
            </>
          ) : (
            <>
              <span className="pt-4 font-semibold">
                No <span className="lowercase"> {list.label} </span>
              </span>
              <span className="text-muted-foreground pb-4">
                Get started by creating a new one.{" "}
              </span>
              {showCreate && <CreateButtonLink list={list} />}
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
        />
      ))}
    </div>
  );
};