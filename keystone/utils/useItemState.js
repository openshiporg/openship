import { useCallback, useMemo, useState } from "react";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { useFieldsObj } from "./useFieldObj";

export function useItemState({ selectedFields, localList, id, field }) {
  const { data, error, loading } = useQuery(
    gql`query($id: ID!) {
item: ${localList.gqlNames.itemQueryName}(where: {id: $id}) {
  id
  relationship: ${field.path} {
    ${selectedFields}
  }
}
}`,
    { variables: { id }, errorPolicy: "all", skip: id === null }
  );
  const { itemsArrFromData, relationshipGetter } = useMemo(() => {
    const dataGetter = makeDataGetter(data, error?.graphQLErrors);
    const relationshipGetter = dataGetter.get("item").get("relationship");
    const isMany = Array.isArray(relationshipGetter.data);
    const itemsArrFromData = (
      isMany
        ? relationshipGetter.data.map((_, i) => relationshipGetter.get(i))
        : [relationshipGetter]
    ).filter((x) => x.data?.id != null);
    return { relationshipGetter, itemsArrFromData };
  }, [data, error]);
  let [{ items, itemsArrFromData: itemsArrFromDataState }, setItemsState] =
    useState({ itemsArrFromData: [], items: {} });

  if (itemsArrFromDataState !== itemsArrFromData) {
    let newItems = {};

    itemsArrFromData.forEach((item) => {
      const initialItemInState = items[item.data.id]?.fromInitialQuery;
      if (
        ((items[item.data.id] && initialItemInState) || !items[item.data.id]) &&
        (!initialItemInState ||
          item.data !== initialItemInState.data ||
          item.errors?.length !== initialItemInState.errors?.length ||
          (item.errors || []).some(
            (err, i) => err !== initialItemInState.errors?.[i]
          ))
      ) {
        newItems[item.data.id] = { current: item, fromInitialQuery: item };
      } else {
        newItems[item.data.id] = items[item.data.id];
      }
    });
    items = newItems;
    setItemsState({
      items: newItems,
      itemsArrFromData,
    });
  }

  return {
    items: useMemo(() => {
      const itemsToReturn = {};
      Object.keys(items).forEach((id) => {
        itemsToReturn[id] = items[id].current;
      });
      return itemsToReturn;
    }, [items]),
    setItems: useCallback(
      (items) => {
        setItemsState((state) => {
          let itemsForState = {};
          Object.keys(items).forEach((id) => {
            if (items[id] === state.items[id]?.current) {
              itemsForState[id] = state.items[id];
            } else {
              itemsForState[id] = {
                current: items[id],
                fromInitialQuery: state.items[id]?.fromInitialQuery,
              };
            }
          });
          return {
            itemsArrFromData: state.itemsArrFromData,
            items: itemsForState,
          };
        });
      },
      [setItemsState]
    ),
    state: (() => {
      if (id === null) {
        return { kind: "loaded" };
      }
      if (loading) {
        return { kind: "loading" };
      }
      if (error?.networkError) {
        return { kind: "error", message: error.networkError.message };
      }
      if (field.many && !relationshipGetter.data) {
        return {
          kind: "error",
          message: relationshipGetter.errors?.[0].message || "",
        };
      }
      return { kind: "loaded" };
    })(),
  };
}
