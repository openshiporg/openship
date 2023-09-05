import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useSort(list, orderableFields) {
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  let sortByFromUrl = typeof query.sortBy === "string" ? query.sortBy : "";

  return useMemo(() => {
    if (sortByFromUrl === "") {
      if (!list.initialSort || !orderableFields.has(list.initialSort.field)) {
        return null;
      }
      return list.initialSort;
    }
    let direction = "ASC";
    let sortByField = sortByFromUrl;
    if (sortByFromUrl.charAt(0) === "-") {
      sortByField = sortByFromUrl.slice(1);
      direction = "DESC";
    }
    if (!orderableFields.has(sortByField)) return null;
    return { field: sortByField, direction };
  }, [sortByFromUrl, list, orderableFields]);
}
