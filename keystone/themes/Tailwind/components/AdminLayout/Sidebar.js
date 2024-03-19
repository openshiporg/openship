"use client";

import { useRef, useEffect } from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import { Transition } from "@headlessui/react";
import Link from "next/link";
import { useAppProvider } from "./AppProvider";
import { SidebarLink } from "./SidebarLink";
import { SidebarLinkGroup } from "./SidebarLinkGroup";
import { SidebarLinkSubgroup } from "./SidebarLinkSubGroup";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "../../primitives/default/ui/button";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";

export function Sidebar({ sidebarNav, authenticatedItem }) {
  const sidebar = useRef(null);
  const { sidebarOpen, setSidebarOpen } = useAppProvider();
  const segments = useSelectedLayoutSegments();

  const pathname = usePathname();

  const END_SESSION = gql`
    mutation EndSession {
      endSession
    }
  `;

  const [endSession, { loading, data }] = useMutation(END_SESSION);
  useEffect(() => {
    if (data?.endSession) {
      window.location.reload();
    }
  }, [data]);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current) return;
      if (!sidebarOpen || sidebar.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <>
      {/* Backdrop */}
      <Transition
        className="md:hidden fixed inset-0 z-10 bg-zinc-900 bg-opacity-20 transition-opacity"
        show={sidebarOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-out duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div ref={sidebar}>
        <Transition
          show={sidebarOpen}
          unmount={false}
          as="aside"
          id="sidebar"
          className="fixed left-0 top-0 bottom-0 w-64 h-screen border-r border-zinc-200 md:left-auto md:shrink-0 z-10 md:!opacity-100 md:!block dark:border-zinc-800 dark:bg-zinc-900"
          enter="transition ease-out duration-200 transform"
          enterFrom="opacity-0 -translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Gradient bg displaying on light layout only */}
          <div
            className="absolute inset-0 -left-[9999px] bg-gradient-to-b from-zinc-50 to-white pointer-events-none -z-10 dark:hidden"
            aria-hidden="true"
          ></div>

          <div className="fixed top-0 bottom-0 w-64 px-4 sm:px-6 md:pl-0 md:pr-8 overflow-y-auto no-scrollbar">
            <div className="h-full pt-24 md:pt-28 pb-4">
              {/* Docs nav */}
              <nav className="flex flex-col h-full">
                <ul className="flex flex-col h-full">
                  <li className="mb-1">
                    <Link
                      href="/dashboard"
                      className={`relative flex items-center font-[650] text-zinc-800 p-1 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:from-blue-400 before:to-purple-500 before:opacity-20 before:-z-10 before:pointer-events-none dark:text-zinc-200 ${!segments.includes("help") && "before:hidden"
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <svg
                        className="mr-3 shrink-0"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="fill-green-300 dark:fill-green-500"
                          d="M19.888 7.804a.88.88 0 0 0-.314-.328l-7.11-4.346a.889.889 0 0 0-.927 0L4.426 7.476a.88.88 0 0 0-.314.328L12 12.624l7.888-4.82Z"
                        />
                        <path
                          className="fill-emerald-500 dark:fill-emerald-950"
                          d="M4.112 7.804a.889.889 0 0 0-.112.43v7.892c0 .31.161.597.426.758l7.11 4.346c.14.085.3.13.464.13v-8.736l-7.888-4.82Z"
                        />
                        <path
                          className="fill-teal-700 dark:fill-teal-900"
                          d="M19.888 7.804c.073.132.112.28.112.43v7.892c0 .31-.161.597-.426.758l-7.11 4.346c-.14.085-.3.13-.464.13v-8.736l7.888-4.82Z"
                        />
                      </svg>
                      <span>Home</span>
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/"
                      className={`relative flex items-center font-[650] text-zinc-800 p-1 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:from-blue-400 before:to-purple-500 before:opacity-20 before:-z-10 before:pointer-events-none dark:text-zinc-200 ${!segments.includes("help") && "before:hidden"
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <svg
                        className="mr-3 shrink-0"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="fill-orange-300 dark:fill-orange-500"
                          d="M19.888 7.804a.88.88 0 0 0-.314-.328l-7.11-4.346a.889.889 0 0 0-.927 0L4.426 7.476a.88.88 0 0 0-.314.328L12 12.624l7.888-4.82Z"
                        />
                        <path
                          className="fill-amber-500 dark:fill-amber-950"
                          d="M4.112 7.804a.889.889 0 0 0-.112.43v7.892c0 .31.161.597.426.758l7.11 4.346c.14.085.3.13.464.13v-8.736l-7.888-4.82Z"
                        />
                        <path
                          className="fill-yellow-700 dark:fill-yellow-900"
                          d="M19.888 7.804c.073.132.112.28.112.43v7.892c0 .31-.161.597-.426.758l-7.11 4.346c-.14.085-.3.13-.464.13v-8.736l7.888-4.82Z"
                        />
                      </svg>
                      <span>Storefront</span>
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/api/graphql"
                      className={`relative flex items-center font-[650] text-zinc-800 p-1 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:from-blue-400 before:to-purple-500 before:opacity-20 before:-z-10 before:pointer-events-none dark:text-zinc-200 ${!segments.includes("help") && "before:hidden"
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <svg
                        className="mr-3 shrink-0"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className="fill-fuchsia-300 dark:fill-fuchsia-500"
                          d="M19.888 7.804a.88.88 0 0 0-.314-.328l-7.11-4.346a.889.889 0 0 0-.927 0L4.426 7.476a.88.88 0 0 0-.314.328L12 12.624l7.888-4.82Z"
                        />
                        <path
                          className="fill-fuchsia-500 dark:fill-fuchsia-950"
                          d="M4.112 7.804a.889.889 0 0 0-.112.43v7.892c0 .31.161.597.426.758l7.11 4.346c.14.085.3.13.464.13v-8.736l-7.888-4.82Z"
                        />
                        <path
                          className="fill-purple-700 dark:fill-purple-900"
                          d="M19.888 7.804c.073.132.112.28.112.43v7.892c0 .31-.161.597-.426.758l-7.11 4.346c-.14.085-.3.13-.464.13v-8.736l7.888-4.82Z"
                        />
                      </svg>
                      <span>GraphQL Playground</span>
                    </Link>
                  </li>
                  {/* 1st level */}
                  <SidebarLinkGroup open={true}>
                    {(handleClick, open) => {
                      return (
                        <>
                          <a
                            href="#0"
                            className={`relative flex items-center font-[650] text-zinc-800 p-1 before:absolute before:inset-0 before:rounded before:bg-gradient-to-tr before:from-blue-300 before:to-indigo-400 dark:before:from-blue-600 dark:before:to-indigo-700 before:opacity-20 before:-z-10 before:pointer-events-none dark:text-zinc-200 ${pathname.startsWith("dashboard") &&
                              "before:hidden"
                              }`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleClick();
                            }}
                          >
                            <svg
                              className="mr-3 shrink-0"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                className="fill-sky-300 dark:fill-sky-400"
                                d="M19.888 7.804a.88.88 0 0 0-.314-.328l-7.11-4.346a.889.889 0 0 0-.927 0L4.426 7.476a.88.88 0 0 0-.314.328L12 12.624l7.888-4.82Z"
                              />
                              <path
                                className="fill-blue-500 dark:fill-blue-900"
                                d="M4.112 7.804a.889.889 0 0 0-.112.43v7.892c0 .31.161.597.426.758l7.11 4.346c.14.085.3.13.464.13v-8.736l-7.888-4.82Z"
                              />
                              <path
                                className="fill-indigo-700 dark:fill-indigo-900"
                                d="M19.888 7.804c.073.132.112.28.112.43v7.892c0 .31-.161.597-.426.758l-7.11 4.346c-.14.085-.3.13-.464.13v-8.736l7.888-4.82Z"
                              />
                            </svg>
                            <span>Admin UI</span>
                          </a>
                          <ScrollArea vpClassName="max-h-[calc(100vh-400px)]">
                            <ul
                              className={`mb-3 ml-4 pl-6 border-l border-zinc-200 dark:border-zinc-800 ${!open && "hidden"
                                }`}
                            >
                              {sidebarNav.map(({ title, href }) => (
                                <li className="max-h-full mt-3">
                                  <SidebarLink href={`/dashboard${href}`}>
                                    {title}
                                  </SidebarLink>
                                </li>
                              ))}
                            </ul>
                          </ScrollArea>
                        </>
                      );
                    }}
                  </SidebarLinkGroup>
                  {/* 1st level */}
                  <li className="mt-auto">
                    <div
                      className={`shadow-sm border bg-muted/25 rounded-lg relative flex items-center text-zinc-800 px-4 py-2 mb-5 dark:text-zinc-200`}
                    >
                      <div class="mr-4 h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 via-indigo-500 to-rose-400 dark:from-indigo-800 dark:via-fuchsia-900 dark:to-green-700" />
                      <div className="flex flex-col">
                        <span className="text-xs">Signed in as</span>
                        <span className="text-sm font-[650]">
                          {authenticatedItem.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        className="ml-auto"
                        size="link"
                        onClick={() => endSession()}
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <LogOut className="w-5 h-5 opacity-50" />
                        )}
                      </Button>
                    </div>
                  </li>
                  {/* 1st level */}
                </ul>
              </nav>
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}
