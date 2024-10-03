import { useMemo } from "react";

import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { PlusIcon } from "lucide-react";
import { Skeleton } from "../../primitives/default/ui/skeleton";
import { LoadingIcon } from "../../components/LoadingIcon";
import { AdminLink } from "../../components/AdminLink";
// Import the necessary icons
import {
  TicketIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  Square2StackIcon,
} from "@heroicons/react/20/solid";
import { cn } from "@keystone/utils/cn";

const ListCard = ({ listKey, count, hideCreate }) => {
  const list = useList(listKey);
  return (
    <div className="shadow-xs flex items-center justify-between rounded-lg bg-zinc-50 border py-2 pl-3 pr-2 dark:border-white/5 dark:bg-black">
      <div className="w-full self-end">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {list.isSingleton ? null : count.type === "success" ? (
            count.count
          ) : count.type === "error" ? (
            count.message
          ) : count.type === "loading" ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            "No access"
          )}
        </div>
        <AdminLink
          className="font-medium text-zinc-700 dark:text-[#D9D9D9] dark:group-hover:text-white"
          href={`/${list.path}${list.isSingleton ? "/1" : ""}`}
        >
          {list.label}
        </AdminLink>
      </div>
      {/* {hideCreate === false && !list.isSingleton && (
        <AdminLink
          className="ml-auto my-auto"
          href={`/${list.path}${list.isSingleton ? "/1" : ""}/create`}
        >
          <Button variant="plain" size="icon">
            <PlusIcon />
          </Button>
        </AdminLink>
      )} */}
      {/* <button className="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#ED8424] via-[#E37712] to-[#D96900] font-sans font-medium text-white transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-b dark:from-[#00D9A2] dark:via-[#00B487] dark:to-[#00916D] dark:text-white">
        <PlusIcon size={32} />
      </button> */}
      {/* <button className="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 font-sans font-medium text-white transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-b dark:from-zinc-400 dark:via-zinc-500 dark:to-zinc-600 dark:text-white">
        <PlusIcon size={32} />
      </button> */}
      {/* <button className="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-600 font-sans font-medium text-white transition-shadow ease-in-out hover:bg-gradient-to-b hover:from-zinc-500 hover:via-zinc-600 hover:to-zinc-700 disabled:opacity-70 dark:bg-gradient-to-b dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800 dark:text-white dark:hover:bg-gradient-to-b dark:hover:from-zinc-700 dark:hover:via-zinc-800 dark:hover:to-zinc-900">
        <PlusIcon size={32} />
      </button> */}
      {hideCreate === false && !list.isSingleton && (
        <AdminLink href={`/${list.path}${list.isSingleton ? "/1" : ""}/create`}>
          <button className="border p-2 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-zinc-50 font-sans font-medium text-zinc-500 transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-bl dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-400 hover:bg-gradient-to-b hover:from-zinc-50 hover:to-zinc-100 hover:text-zinc-700 dark:hover:bg-gradient-to-bl dark:hover:from-zinc-800 dark:hover:to-zinc-900 dark:hover:text-zinc-300">
            <PlusIcon size={28} />
          </button>
        </AdminLink>
      )}
    </div>
  );
};

const OmsCard = ({ title, icon: Icon, color, href }) => (
  <AdminLink
    href={href}
    className="flex items-center justify-between rounded-lg bg-zinc-50 border py-2 pl-3 pr-2 dark:border-white/5 dark:bg-black"
  >
    <div className="flex gap-2.5 items-center">
      <Icon
        className={cn("w-4 h-4", {
          "text-orange-500 dark:text-orange-400": color === "orange",
          "text-indigo-500 dark:text-indigo-400": color === "indigo",
          "text-emerald-500 dark:text-emerald-400": color === "emerald",
          "text-violet-500 dark:text-violet-400": color === "violet",
        })}
      />
      <span className="font-medium text-zinc-700 dark:text-[#D9D9D9]">
        {title}
      </span>
    </div>
    <div className="text-zinc-400 dark:text-zinc-500">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </AdminLink>
);

export const HomePage = () => {
  const {
    adminMeta: { lists },
    visibleLists,
  } = useKeystone();
  const query = useMemo(
    () => gql`
  query {
    keystone {
      adminMeta {
        lists {
          key
          hideCreate
        }
      }
    }
    ${Object.values(lists)
      .filter((list) => !list.isSingleton)
      .map((list) => `${list.key}: ${list.gqlNames.listQueryCountName}`)
      .join("\n")}
  }`,
    [lists]
  );
  let { data, error } = useQuery(query, { errorPolicy: "all" });

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  return (
    <div>
      <div className="mt-2 mb-4 flex-col items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground">
          {Object.keys(lists).length} Models
        </p>
      </div>

      {/* OMS section */}
      <div className="mb-6">
        <h2 className="tracking-wide uppercase font-medium mb-2 text-muted-foreground">
          Order Management System
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <OmsCard
            title="Orders"
            icon={TicketIcon}
            color="orange"
            href="/dashboard/oms/orders"
          />
          <OmsCard
            title="Shops"
            icon={Square3Stack3DIcon}
            color="indigo"
            href="/dashboard/oms/shops"
          />
          <OmsCard
            title="Channels"
            icon={CircleStackIcon}
            color="emerald"
            href="/dashboard/oms/channels"
          />
          <OmsCard
            title="Matches"
            icon={Square2StackIcon}
            color="violet"
            href="/dashboard/oms/matches"
          />
        </div>
      </div>

      {/* New section for other cards */}
      <div className="mb-4">
        <h2 className="tracking-wide uppercase font-medium mb-2 text-muted-foreground">
          Data Models
        </h2>
        {visibleLists.state === "loading" ? (
          <LoadingIcon label="Loading lists" size="large" tone="passive" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
            {(() => {
              if (visibleLists.state === "error") {
                return (
                  <span className="text-red-600 dark:text-red-500 text-sm">
                    {visibleLists.error instanceof Error
                      ? visibleLists.error.message
                      : visibleLists.error[0].message}
                  </span>
                );
              }
              return Object.keys(lists).map((key) => {
                if (!visibleLists.lists.has(key)) {
                  return null;
                }
                const result = dataGetter.get(key);
                return (
                  <ListCard
                    count={
                      data
                        ? result.errors
                          ? { type: "error", message: result.errors[0].message }
                          : { type: "success", count: data[key] }
                        : { type: "loading" }
                    }
                    hideCreate={
                      data?.keystone.adminMeta.lists.find(
                        (list) => list.key === key
                      )?.hideCreate ?? false
                    }
                    key={key}
                    listKey={key}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};