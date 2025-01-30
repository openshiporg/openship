import { useMemo } from "react";
import dynamic from "next/dynamic";

import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { PlusIcon, ChevronRight } from "lucide-react";
import { Skeleton } from "../../primitives/default/ui/skeleton";
import { AdminLink } from "../../components/AdminLink";
import { cn } from "@keystone/utils/cn";
import { PageBreadcrumbs } from "../../components/PageBreadcrumbs";

// Dynamically import OnboardingCard with error handling
// const OnboardingCard = dynamic(
//   () => import("@keystone/platform/OnboardingCard").then(mod => mod.OnboardingCard)
//     .catch(() => () => null), // Return empty component if module not found
//   { 
//     ssr: false,
//     loading: () => null 
//   }
// );

const cardColors = [
  {
    name: "amber",
    class:
      "text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300",
    gradient:
      "bg-gradient-to-br from-amber-100 via-amber-50 to-white dark:from-amber-500/20 dark:via-amber-500/10 dark:to-amber-500/5",
  },
  {
    name: "emerald",
    class:
      "text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300",
    gradient:
      "bg-gradient-to-br from-emerald-100 via-emerald-50 to-white dark:from-emerald-500/20 dark:via-emerald-500/10 dark:to-emerald-500/5",
  },
  {
    name: "violet",
    class:
      "text-violet-500 dark:text-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-300",
    gradient:
      "bg-gradient-to-br from-violet-100 via-violet-50 to-white dark:from-violet-500/20 dark:via-violet-500/10 dark:to-violet-500/5",
  },
  {
    name: "cyan",
    class:
      "text-cyan-500 dark:text-cyan-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300",
    gradient:
      "bg-gradient-to-br from-cyan-100 via-cyan-50 to-white dark:from-cyan-500/20 dark:via-cyan-500/10 dark:to-cyan-500/5",
  },
  {
    name: "rose",
    class:
      "text-rose-500 dark:text-rose-400 group-hover:text-rose-600 dark:group-hover:text-rose-300",
    gradient:
      "bg-gradient-to-br from-rose-100 via-rose-50 to-white dark:from-rose-500/20 dark:via-rose-500/10 dark:to-rose-500/5",
  },
  {
    name: "lime",
    class:
      "text-lime-500 dark:text-lime-400 group-hover:text-lime-600 dark:group-hover:text-lime-300",
    gradient:
      "bg-gradient-to-br from-lime-100 via-lime-50 to-white dark:from-lime-500/20 dark:via-lime-500/10 dark:to-lime-500/5",
  },
  {
    name: "blue",
    class:
      "text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300",
    gradient:
      "bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-500/20 dark:via-blue-500/10 dark:to-blue-500/5",
  },
  {
    name: "orange",
    class:
      "text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300",
    gradient:
      "bg-gradient-to-br from-orange-100 via-orange-50 to-white dark:from-orange-500/20 dark:via-orange-500/10 dark:to-orange-500/5",
  },
  {
    name: "fuchsia",
    class:
      "text-fuchsia-500 dark:text-fuchsia-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-300",
    gradient:
      "bg-gradient-to-br from-fuchsia-100 via-fuchsia-50 to-white dark:from-fuchsia-500/20 dark:via-fuchsia-500/10 dark:to-fuchsia-500/5",
  },
  {
    name: "indigo",
    class:
      "text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
    gradient:
      "bg-gradient-to-br from-indigo-100 via-indigo-50 to-white dark:from-indigo-500/20 dark:via-indigo-500/10 dark:to-indigo-500/5",
  },
  {
    name: "teal",
    class:
      "text-teal-500 dark:text-teal-400 group-hover:text-teal-600 dark:group-hover:text-teal-300",
    gradient:
      "bg-gradient-to-br from-teal-100 via-teal-50 to-white dark:from-teal-500/20 dark:via-teal-500/10 dark:to-teal-500/5",
  },
  {
    name: "yellow",
    class:
      "text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-300",
    gradient:
      "bg-gradient-to-br from-yellow-100 via-yellow-50 to-white dark:from-yellow-500/20 dark:via-yellow-500/10 dark:to-yellow-500/5",
  },
  {
    name: "purple",
    class:
      "text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300",
    gradient:
      "bg-gradient-to-br from-purple-100 via-purple-50 to-white dark:from-purple-500/20 dark:via-purple-500/10 dark:to-purple-500/5",
  },
  {
    name: "sky",
    class:
      "text-sky-500 dark:text-sky-400 group-hover:text-sky-600 dark:group-hover:text-sky-300",
    gradient:
      "bg-gradient-to-br from-sky-100 via-sky-50 to-white dark:from-sky-500/20 dark:via-sky-500/10 dark:to-sky-500/5",
  },
  {
    name: "green",
    class:
      "text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300",
    gradient:
      "bg-gradient-to-br from-green-100 via-green-50 to-white dark:from-green-500/20 dark:via-green-500/10 dark:to-green-500/5",
  },
  {
    name: "pink",
    class:
      "text-pink-500 dark:text-pink-400 group-hover:text-pink-600 dark:group-hover:text-pink-300",
    gradient:
      "bg-gradient-to-br from-pink-100 via-pink-50 to-white dark:from-pink-500/20 dark:via-pink-500/10 dark:to-pink-500/5",
  },
];

// Try to import customNavItems, fallback to empty array if not found
let customNavItems = [];
try {
  const navItems = require("@keystone/index").customNavItems;
  if (navItems) customNavItems = navItems;
} catch (e) {
  // Project doesn't have customNavItems defined
}

const ListCard = ({ listKey, count, hideCreate }) => {
  const list = useList(listKey);
  return (
    <div className="shadow-xs flex items-center justify-between rounded-lg bg-zinc-50 border py-2 pl-3 pr-2 dark:bg-black">
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

const OmsCard = ({ title, icon: Icon, href, colorClass, gradient }) => (
  <AdminLink
    href={href}
    className={cn(
      "group flex h-auto w-full items-center justify-between gap-4 rounded-lg border bg-muted/40 p-3 text-left transition-colors hover:bg-accent shadow-sm",
      "hover:border-accent-foreground/20 dark:hover:border-accent-foreground/20"
    )}
  >
    <div className="flex items-center gap-3">
      {Icon && (
        <div
          className={cn(
            "rounded-md p-1 ring-1 ring-inset ring-black/5 dark:ring-white/5",
            gradient
          )}
        >
          <Icon strokeWidth={2.5} className={cn("h-3 w-3", colorClass)} />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-semibold leading-none tracking-wide uppercase text-sm text-zinc-600 dark:text-[#D9D9D9]">
          {title}
        </h3>
      </div>
    </div>
    <ChevronRight
      className="h-4 w-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
    />
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
    <>
      <PageBreadcrumbs
        items={[
          {
            type: "page",
            label: "Dashboard",
            showModelSwitcher: true,
            switcherType: "platform",
          },
        ]}
      />
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
        <div className="flex-col items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground">
            {Object.keys(lists).length} Models
          </p>
        </div>

        {/* <OnboardingCard /> */}

        {/* Platform section */}
        <div className="mb-6">
          <h2 className="tracking-wide uppercase font-medium mb-2 text-muted-foreground">
            Platform
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {customNavItems.map((item, index) => {
              const colorData = cardColors[index % cardColors.length];
              return (
                <OmsCard
                  key={item.url}
                  title={item.title}
                  icon={item.icon}
                  href={item.href || item.url}
                  colorClass={colorData.class}
                  gradient={colorData.gradient}
                />
              );
            })}
          </div>
        </div>

        {/* Data Models section */}
        <div className="mb-4">
          <h2 className="tracking-wide uppercase font-medium mb-2 text-muted-foreground">
            Data Models
          </h2>
          {visibleLists.state === "loading" ? null : (
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
                            ? {
                                type: "error",
                                message: result.errors[0].message,
                              }
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
      </main>
    </>
  );
};
