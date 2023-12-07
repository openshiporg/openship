import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useQueryParamsFromLocalStorage(listKey) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const localStorageKey = `keystone.list.${listKey}.list.page.info`;

  const storeableQueries = ["sortBy", "fields"];
  const resetToDefaults = () => {
    localStorage.removeItem(localStorageKey);
    // Assuming you are using 'router' from 'next/router'
    router.push(pathname);
  };

  // GET QUERY FROM CACHE IF CONDITIONS ARE RIGHT
  // MERGE QUERY PARAMS FROM CACHE WITH QUERY PARAMS FROM ROUTER
  useEffect(() => {
    let hasSomeQueryParamsWhichAreAboutListPage = Object.keys(
      query
    ).some((x) => {
      return x.startsWith("!") || storeableQueries.includes(x);
    });

    if (!hasSomeQueryParamsWhichAreAboutListPage && router.isReady) {
      const queryParamsFromLocalStorage = localStorage.getItem(localStorageKey);
      let parsed;
      try {
        parsed = JSON.parse(queryParamsFromLocalStorage);
      } catch (err) {}
      if (parsed) {
        router.replace({ query: { ...query, ...parsed } });
      }
    }
  }, [localStorageKey, router.isReady]);
  useEffect(() => {
    let queryParamsToSerialize = {};
    Object.keys(query).forEach((key) => {
      if (key.startsWith("!") || storeableQueries.includes(key)) {
        queryParamsToSerialize[key] = query[key];
      }
    });
    if (Object.keys(queryParamsToSerialize).length) {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify(queryParamsToSerialize)
      );
    } else {
      localStorage.removeItem(localStorageKey);
    }
  }, [localStorageKey, router]);

  return { resetToDefaults };
}
