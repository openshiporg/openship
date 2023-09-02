import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export function useSelectedFields(list, fieldModesByFieldPath) {
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const selectedFieldsFromUrl =
    typeof query.fields === "string" ? query.fields : "";
  return useMemo(() => {
    let selectedFieldsArray = selectedFieldsFromUrl
      ? selectedFieldsFromUrl.split(",")
      : list.initialColumns;
    let fields = selectedFieldsArray.filter((field) => {
      return fieldModesByFieldPath[field] === "read";
    });

    return new Set(fields.length === 0 ? [list.labelField] : fields);
  }, [list, selectedFieldsFromUrl, fieldModesByFieldPath]);
}
