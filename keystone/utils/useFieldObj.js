import { useMemo } from "react";

export function useFieldsObj(list, fields) {
  return useMemo(() => {
    const editFields = {};
    fields?.forEach((fieldPath) => {
      editFields[fieldPath] = list.fields[fieldPath];
    });
    return editFields;
  }, [fields, list.fields]);
}
