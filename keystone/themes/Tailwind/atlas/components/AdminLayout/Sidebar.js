"use client";

import { useRef, useEffect } from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import { Transition } from "@headlessui/react";
import Link from "next/link";
import { useAppProvider } from "./AppProvider";
import { SidebarLink } from "./SidebarLink";
import { SidebarLinkGroup } from "./SidebarLinkGroup";
import { Home, Package2, LayoutDashboard } from "lucide-react";
import { ScrollArea } from "@keystone/primitives/default/ui/scroll-area";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import { Logo } from "@keystone/logo";

export function Sidebar({ sidebarNav, authenticatedItem, children }) {
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
      {/* <Transition
        className="md:hidden fixed inset-0 z-10 bg-opacity-20 transition-opacity"
        show={sidebarOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-out duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        aria-hidden="true"
      /> */}

      {/* Sidebar */}
      <div ref={sidebar}>
        <Transition
          show={sidebarOpen}
          unmount={false}
          as="aside"
          id="sidebar"
          className="fixed left-0 top-0 bottom-0 hidden md:w-64 lg:w-72 border-r h-screen border-zinc-200 md:left-auto md:shrink-0 z-10 md:!opacity-100 md:!block dark:border-zinc-800"
          enter="transition ease-out duration-200 transform"
          enterFrom="opacity-0 -translate-x-full"
          enterTo="opacity-100 translate-x-0"
          leave="transition ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="h-full">
            {/* Docs nav */}
            <nav className="flex flex-col h-full gap-5">
              <div className="min-h-screen w-full">
                <div className="bg-muted/40 flex h-full max-h-screen flex-col gap-2">
                  <div className="flex h-14 items-center border-b lg:h-[60px]">
                    <Link
                      href="/"
                      className="flex items-center px-[1.6rem] lg:px-[2.15rem]"
                    >
                      <Logo />
                    </Link>
                  </div>
                  <SideBarUI sidebarNav={sidebarNav} />
                </div>
              </div>
            </nav>
          </div>
        </Transition>
      </div>
    </>
  );
}

export function SideBarUI({
  sidebarNav,
  scrollHeight = "max-h-[calc(100vh-200px)]",
}) {
  return (
    <div className="flex-1">
      <nav className="grid items-start px-2 font-medium lg:px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-muted-foreground transition-all hover:text-primary"
        >
          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 shadow-sm border-[1.5px] border-emerald-200 dark:border-emerald-800 rounded-lg p-1.5">
            <Home className="h-4 w-4 stroke-emerald-500" />
          </div>
          Dashboard
        </Link>
        <Link
          href="/api/graphql"
          className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-muted-foreground transition-all hover:text-primary"
        >
          <div className="bg-fuchsia-50/50 dark:bg-fuchsia-900/20 shadow-sm border-[1.5px] border-fuchsia-200 dark:border-fuchsia-800 rounded-lg p-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="fill-fuchsia-500"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.125 6.45c0-.224.12-.431.315-.542l6.25-3.572a.625.625 0 0 1 .62 0l6.25 3.572a.625.625 0 0 1 .315.542v7.099c0 .224-.12.431-.315.542l-6.25 3.572a.625.625 0 0 1-.62 0L3.44 14.09a.625.625 0 0 1-.315-.542V6.45ZM1.25 13.55a2.5 2.5 0 0 0 1.26 2.17l6.25 3.572a2.5 2.5 0 0 0 2.48 0l6.25-3.572a2.5 2.5 0 0 0 1.26-2.17V6.45a2.5 2.5 0 0 0-1.26-2.17L11.24.708a2.5 2.5 0 0 0-2.48 0L2.51 4.28a2.5 2.5 0 0 0-1.26 2.17v7.099Z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="m10 .338-8.522 14.35h17.044L10 .337ZM4.772 12.812 10 4.01l5.228 8.802H4.772Z"
              />
            </svg>
          </div>
          GraphQL Playground
        </Link>
        <SidebarLinkGroup open={true}>
          {(handleClick, open) => (
            <>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 pt-1.5 text-muted-foreground transition-all hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
              >
                <div className="bg-blue-50/50 dark:bg-blue-900/20 shadow-sm border-[1.5px] border-blue-200 dark:border-blue-800 rounded-lg p-1.5">
                  <LayoutDashboard className="h-4 w-4 stroke-blue-500" />
                </div>
                Admin UI
              </a>
              <ScrollArea vpClassName={`ml-3 ${scrollHeight}`}>
                <ul
                  className={`mb-3 ml-[.95rem] pl-4 border-l-2 border-blue-100 dark:border-blue-900 ${!open && "hidden"}`}
                >
                  {sidebarNav.map(({ title, href }) => (
                    <li className="max-h-full">
                      <SidebarLink className="pt-3" href={`/dashboard${href}`}>
                        {title}
                      </SidebarLink>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </SidebarLinkGroup>
      </nav>
    </div>
  );
}
