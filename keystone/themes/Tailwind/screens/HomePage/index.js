import { useMemo } from "react";

import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { AdminLink } from "@keystone/components/AdminLink";
import { LoadingIcon } from "@keystone/components/LoadingIcon";
import { Card } from "@keystone/primitives/default/ui/card";
import { Button } from "@keystone/primitives/default/ui/button";
import { Skeleton } from "@keystone/primitives/default/ui/skeleton";
import { ExternalLink, PlusIcon } from "lucide-react";

const ListCard = ({ listKey, count, hideCreate }) => {
  const list = useList(listKey);
  return (
    <Card className="flex p-3 bg-muted/20 shadow-sm">
      <AdminLink
        className="pr-4"
        href={`/${list.path}${list.isSingleton ? "/1" : ""}`}
      >
        <h3 className="scroll-m-20 text-md font-bold tracking-tight lg:text-lg text-muted-foreground/80">
          {list.label}{" "}
        </h3>
        {list.isSingleton ? null : count.type === "success" ? (
          <span className="text-foreground/80 text-sm">
            {count.count} item{count.count !== 1 ? "s" : ""}
          </span>
        ) : count.type === "error" ? (
          count.message
        ) : count.type === "loading" ? (
          <Skeleton className="mt-2 h-4 w-[100px]" />
        ) : (
          "No access"
        )}
      </AdminLink>
      {hideCreate === false && !list.isSingleton && (
        <AdminLink
          className="ml-auto my-auto"
          href={`/${list.path}${list.isSingleton ? "/1" : ""}/create`}
        >
          <Button variant="secondary" size="icon" className="border">
            <PlusIcon />
          </Button>
        </AdminLink>
      )}
    </Card>
  );
};

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
      <h1 className="relative z-40 mb-10 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Dashboard
      </h1>
      {visibleLists.state === "loading" ? (
        <LoadingIcon label="Loading lists" size="large" tone="passive" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-12">
          {(() => {
            if (visibleLists.state === "error") {
              return (
                <span className="text-red-600 dark:text-red-500">
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
  );
};
