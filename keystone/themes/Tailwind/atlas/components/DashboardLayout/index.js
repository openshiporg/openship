import { useKeystone } from "@keystone/keystoneProvider";
import { NavigationSidebar } from "./NavigationSidebar";
import { AppProvider, useAppProvider } from "./AppProvider";

export const HEADER_HEIGHT = 80;

export const DashboardLayout = ({ children }) => {
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
      <span className="text-red-600 dark:text-red-500 text-sm">
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

  const sidebarLinks = renderableLists.map((list) => ({
    title: list.label,
    href: `/${list.path}${list.isSingleton ? "/1" : ""}`,
  }));

  return (
    <AppProvider>
      <NavigationSidebar
        authenticatedItem={authenticatedItem}
        sidebarLinks={sidebarLinks}
      >
        {children}
      </NavigationSidebar>
    </AppProvider>
  );
};
