import { useMemo } from "react";
import { idValidators } from "./idValidators";


export function useFilter(search, list, searchFields) {
  return useMemo(() => {
    if (!search.length)
      return { OR: [] };

    const idFieldKind = list.fields.id.controller.idFieldKind;
    const trimmedSearch = search.trim();
    const isValidId = idValidators[idFieldKind](trimmedSearch);

    const conditions = [];
    if (isValidId) {
      conditions.push({ id: { equals: trimmedSearch } });
    }

    for (const fieldKey of searchFields) {
      const field = list.fields[fieldKey];
      conditions.push({
        [field.path]: {
          contains: trimmedSearch,
          mode: field.search === "insensitive" ? "insensitive" : undefined,
        },
      });
    }

    return { OR: conditions };
  }, [search, list, searchFields]);
}
