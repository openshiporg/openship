import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function useFilters(list, filterableFields) {
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const possibleFilters = useMemo(() => {
    const possibleFilters = {}
    Object.entries(list.fields).forEach(([fieldPath, field]) => {
      if (field.controller.filter && filterableFields.has(fieldPath)) {
        Object.keys(field.controller.filter.types).forEach(type => {
          possibleFilters[`!${fieldPath}_${type}`] = { type, field: fieldPath }
        })
      }
    })
    return possibleFilters
  }, [list, filterableFields])
  const filters = useMemo(() => {
    let filters = []
    Object.keys(query).forEach(key => {
      const filter = possibleFilters[key]
      const val = query[key]
      if (filter && typeof val === "string") {
        let value
        try {
          value = JSON.parse(val)
        } catch (err) {}
        if (val !== undefined) {
          filters.push({ ...filter, value })
        }
      }
    })

    const where = filters.reduce((_where, filter) => {
      return Object.assign(
        _where,
        list.fields[filter.field].controller.filter.graphql({
          type: filter.type,
          value: filter.value
        })
      )
    }, {})
    if (list.isSingleton)
      return { filters, where: { id: { equals: 1 }, AND: [where] } }
    return { filters, where }
  }, [query, possibleFilters, list])
  return filters
}
