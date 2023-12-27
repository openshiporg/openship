import { useState } from "react";
import { useKeystone } from "@keystone/keystoneProvider";
import Header from "./Header";
import { Sidebar } from "./Sidebar";
import { AppProvider } from "./AppProvider";
import Illustration from "../../../../../public/images/hero-illustration.svg";
import Image from "next/image";

export const HEADER_HEIGHT = 80;

export const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(true);

  const {
    adminMeta: { lists },
    adminConfig,
    authenticatedItem,
    visibleLists,
  } = useKeystone();

  if (visibleLists.state === "loading") return null;
  // This visible lists error is critical and likely to result in a server restart
  // if it happens, we'll show the error and not render the navigation component/s
  if (visibleLists.state === "error") {
    return (
      <span className="text-red-600 dark:text-red-500">
        {visibleLists.error instanceof Error
          ? visibleLists.error.message
          : visibleLists.error[0].message}
      </span>
    );
  }
  const renderableLists = Object.keys(lists)
    .map((key) => {
      if (!visibleLists.lists.has(key)) return null;
      return lists[key];
    })
    .filter((x) => Boolean(x));

  console.log({ renderableLists });

  if (adminConfig?.components?.Navigation) {
    return (
      <adminConfig.components.Navigation
        authenticatedItem={authenticatedItem}
        lists={renderableLists}
      />
    );
  }

  const sidebarNav = renderableLists.map((list) => ({
    title: list.label,
    href: `/${list.path}${list.isSingleton ? "/1" : ""}`,
  }));

  const HEADER_HEIGHT = 120;

  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen overflow-hidden">
        <Header />

        {/*  Page content */}
        <main className="grow">
          <section className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none -z-10">
              <Image
                className="max-w-none"
                src={Illustration}
                priority
                alt="Page illustration"
                aria-hidden="true"
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Main content */}
              <div>
                {/* Sidebar */}
                <Sidebar
                  sidebarNav={sidebarNav}
                  authenticatedItem={authenticatedItem}
                />

                {/* Page container */}
                <div className="md:grow md:pl-64 lg:pr-6 xl:pr-0 ">
                  <div className="pt-24 md:pt-28 pb-8 md:pl-6 lg:pl-12 ">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AppProvider>
    // <div className="flex flex-col h-screen">
    //   <header className="sticky top-0 z-40 border-b bg-background">
    //     <div className="container flex h-16 items-center justify-between py-4">
    //       <MainNav sideData={<SideData />} />
    //       <div className="end">
    //         <ModeToggle />
    //       </div>
    //     </div>
    //   </header>
    //   <div className="container flex flex-grow overflow-hidden">
    //     <aside className="w-[240px] min-w-[240px] hidden md:flex overflow-auto">
    //       {/* <SideData /> */}
    //     </aside>
    //     <main className="flex-grow overflow-hidden py-10">
    //       <ScrollArea className="h-full overflow-auto">
    //         <div className="px-4">{children}</div>
    //       </ScrollArea>
    //     </main>
    //   </div>
    // </div>
  );
};
