import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useMemo } from "react";

export function useLazyMetadata(query) {
  const result = useQuery(query, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });
  return useMemo(() => {
    const refetch = async () => {
      await result.refetch();
    };

    const dataGetter = makeDataGetter(result.data, result.error?.graphQLErrors);
    const authenticatedItemGetter = dataGetter.get("authenticatedItem");
    const keystoneMetaGetter = dataGetter.get("keystone");

    return {
      refetch,
      authenticatedItem: getAuthenticatedItem(
        result,
        authenticatedItemGetter.errors ||
          (result.error?.networkError ?? undefined)
      ),
      visibleLists: getVisibleLists(
        result,
        keystoneMetaGetter.errors || (result.error?.networkError ?? undefined)
      ),
      createViewFieldModes: getCreateViewFieldModes(
        result,
        keystoneMetaGetter.errors || (result.error?.networkError ?? undefined)
      ),
    };
  }, [result]);
}

function getCreateViewFieldModes({ data }, error) {
  if (error) {
    return { state: "error", error };
  }
  if (data) {
    const lists = {};
    data.keystone.adminMeta.lists.forEach((list) => {
      lists[list.key] = {};
      list.fields.forEach((field) => {
        lists[list.key][field.path] = field.createView.fieldMode;
      });
    });
    return { state: "loaded", lists };
  }

  return { state: "loading" };
}

function getVisibleLists({ data }, error) {
  if (error) {
    return { state: "error", error };
  }
  if (data) {
    const lists = new Set();
    data.keystone.adminMeta.lists.forEach((list) => {
      if (!list.isHidden) {
        lists.add(list.key);
      }
    });
    return { state: "loaded", lists };
  }

  return { state: "loading" };
}

function getAuthenticatedItem({ data }, error) {
  if (error) {
    return { state: "error", error };
  }
  if (data) {
    if (
      !data.authenticatedItem ||
      // this is for the case where there is a new type
      // in the AuthenticatedItem union and the query
      // that the admin ui has doesn't get the id
      // (yes, undefined is very specific and very intentional, it should not be checking for null)
      data.authenticatedItem.id === undefined
    ) {
      return { state: "unauthenticated" };
    }
    const labelField = Object.keys(data.authenticatedItem).filter(
      (x) => x !== "__typename" && x !== "id"
    )[0];
    return {
      state: "authenticated",
      id: data.authenticatedItem.id,
      label: data.authenticatedItem[labelField] || data.authenticatedItem.id,
      listKey: data.authenticatedItem.__typename,
    };
  }

  return { state: "loading" };
}
