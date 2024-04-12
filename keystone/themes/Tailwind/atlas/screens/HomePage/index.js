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
    // <Card className="flex bg-muted/20 border-none">
    //   <div className="h-full w-20 rounded-s-md bg-gradient-to-br from-indigo-400 via-indigo-500 to-rose-400 dark:from-indigo-800 dark:via-fuchsia-900 dark:to-green-700" />

    //   <AdminLink
    //     className="flex-1 pr-4 p-3"
    //     href={`/${list.path}${list.isSingleton ? "/1" : ""}`}
    //   >
    //     <h3 className="scroll-m-20 text-md font-bold tracking-tight lg:text-lg text-muted-foreground">
    //       {list.label}{" "}
    //     </h3>

    //     {list.isSingleton ? null : count.type === "success" ? (
    //       <span className="text-foreground/80 text-sm">
    //         {count.count} item{count.count !== 1 ? "s" : ""}
    //       </span>
    //     ) : count.type === "error" ? (
    //       count.message
    //     ) : count.type === "loading" ? (
    //       <Skeleton className="mt-2 h-4 w-24" />
    //     ) : (
    //       "No access"
    //     )}
    //   </AdminLink>
    //   {hideCreate === false && !list.isSingleton && (
    //     <AdminLink
    //       className="ml-auto my-auto"
    //       href={`/${list.path}${list.isSingleton ? "/1" : ""}/create`}
    //     >
    //       <Button variant="plain" size="icon" className="border">
    //         <PlusIcon />
    //       </Button>
    //     </AdminLink>
    //   )}
    // </Card>
    <div class="shadow-sm flex items-center justify-between rounded-xl bg-slate-50 border py-2 pl-3 pr-2 dark:border-white/5 dark:bg-slate-900/30">
      {/* <div class="h-8 md:h-4"></div> */}
      {/* <div class="text-[38px] text-[#F2F2F2] transition-colors duration-300 group-hover:text-[#E8E8E8] dark:text-slate-400 dark:group-hover:text-[#2E2E2E] md:text-[56px]">
        H1
      </div> */}
      {/* <div class="flex h-8 w-2/12 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400 transition-colors duration-300 group-hover:bg-[#E8E8E8] group-hover:text-[#C2C2C2] dark:bg-slate-500 dark:text-[#1A1A1A] dark:group-hover:bg-[#2E2E2E] dark:group-hover:text-[#121212] md:h-10 md:w-1/3 md:text-lg">
        Hello
      </div> */}
      <div class="w-full self-end">
        <div class="text-sm text-slate-500 dark:text-slate-400">
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
          className="font-medium text-slate-700 dark:text-[#D9D9D9] dark:group-hover:text-white"
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
      {/* <button class="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#ED8424] via-[#E37712] to-[#D96900] font-sans font-medium text-white transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-b dark:from-[#00D9A2] dark:via-[#00B487] dark:to-[#00916D] dark:text-white">
        <PlusIcon size={32} />
      </button> */}
      {/* <button className="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 font-sans font-medium text-white transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-b dark:from-slate-400 dark:via-slate-500 dark:to-slate-600 dark:text-white">
        <PlusIcon size={32} />
      </button> */}
      {/* <button className="py-2 px-2.5 mr-1 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600 font-sans font-medium text-white transition-shadow ease-in-out hover:bg-gradient-to-b hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 disabled:opacity-70 dark:bg-gradient-to-b dark:from-slate-600 dark:via-slate-700 dark:to-slate-800 dark:text-white dark:hover:bg-gradient-to-b dark:hover:from-slate-700 dark:hover:via-slate-800 dark:hover:to-slate-900">
        <PlusIcon size={32} />
      </button> */}
      {hideCreate === false && !list.isSingleton && (
        <AdminLink href={`/${list.path}${list.isSingleton ? "/1" : ""}/create`}>
          <button className="border p-2 rounded-lg flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50 font-sans font-medium text-slate-500 transition-shadow ease-in-out disabled:opacity-70 dark:bg-gradient-to-bl dark:from-slate-900 dark:to-black dark:text-slate-400 hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-100 hover:text-slate-700 dark:hover:bg-gradient-to-bl dark:hover:from-slate-800 dark:hover:to-slate-900 dark:hover:text-slate-300">
            <PlusIcon size={28} />
          </button>
        </AdminLink>
      )}
    </div>
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
      <div className="mt-2 mb-4 flex-col items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <p className="text-muted-foreground">
          {Object.keys(lists).length} Models
        </p>
      </div>
      {visibleLists.state === "loading" ? (
        <LoadingIcon label="Loading lists" size="large" tone="passive" />
      ) : (
        // <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        //   <div class="grid gap-4">
        //     <div>
        //       <div class="flex flex-col items-center justify-between rounded-xl bg-white p-1 dark:border dark:border-white/5 dark:bg-[#1A1A1A]">
        //         <div class="h-8 md:h-4"></div>
        //         <div class="text-[38px] text-[#F2F2F2] transition-colors duration-300 group-hover:text-[#E8E8E8] dark:text-[#242424] dark:group-hover:text-[#2E2E2E] md:text-[56px]">
        //           H1
        //         </div>
        //         <div class="w-full self-end p-2">
        //           <div class="text-xs text-[#DEDEDE] dark:text-[#333333]">
        //             02
        //           </div>
        //           <div class="text-xs font-medium text-[#171717] dark:text-[#D9D9D9] dark:group-hover:text-white">
        //             Text
        //           </div>
        //         </div>
        //         <div class="absolute top-24 h-10 w-full bg-transparent md:top-36"></div>
        //       </div>
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-1.jpg"
        //         alt=""
        //       />
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-2.jpg"
        //         alt=""
        //       />
        //     </div>
        //   </div>
        //   <div class="grid gap-4">
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-3.jpg"
        //         alt=""
        //       />
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-4.jpg"
        //         alt=""
        //       />
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-5.jpg"
        //         alt=""
        //       />
        //     </div>
        //   </div>
        //   <div class="grid gap-4">
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-6.jpg"
        //         alt=""
        //       />
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-7.jpg"
        //         alt=""
        //       />
        //     </div>
        //     <div>
        //       <img
        //         class="h-auto max-w-full rounded-lg"
        //         src="https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-8.jpg"
        //         alt=""
        //       />
        //     </div>
        //   </div>
        // </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-12">
          {(() => {
            console.log({ lists });
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
  );
};
