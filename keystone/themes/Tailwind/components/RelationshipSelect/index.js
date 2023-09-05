/** @jsxRuntime classic */
/** @jsx jsx */
import "intersection-observer";
import { jsx } from "@keystone-ui/core";
import {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  useRef,
} from "react";

import { MultiSelect, Select, selectComponents } from "@keystone-ui/fields";
import { validate as validateUUID } from "uuid";

import {
  ApolloClient,
  gql,
  InMemoryCache,
  useApolloClient,
  useQuery,
} from "@keystone-6/core/admin-ui/apollo";

function useIntersectionObserver(cb, ref) {
  const cbRef = useRef(cb)
  useEffect(() => {
    cbRef.current = cb
  })
  useEffect(() => {
    let observer = new IntersectionObserver(
      (...args) => cbRef.current(...args),
      {}
    )
    let node = ref.current
    if (node !== null) {
      observer.observe(node)
      return () => observer.unobserve(node)
    }
  }, [ref])
}

const idValidators = {
  uuid: validateUUID,
  cuid(value) {
    return value.startsWith("c")
  },
  autoincrement(value) {
    return /^\d+$/.test(value)
  }
}

function useDebouncedValue(value, limitMs) {
  const [debouncedValue, setDebouncedValue] = useState(() => value)

  useEffect(() => {
    let id = setTimeout(() => {
      setDebouncedValue(() => value)
    }, limitMs)
    return () => {
      clearTimeout(id)
    }
  }, [value, limitMs])
  return debouncedValue
}

export function useFilter(search, list, searchFields) {
  return useMemo(() => {
    if (!search.length) return { OR: [] }

    const idFieldKind = list.fields.id.controller.idFieldKind
    const trimmedSearch = search.trim()
    const isValidId = idValidators[idFieldKind](trimmedSearch)

    const conditions = []
    if (isValidId) {
      conditions.push({ id: { equals: trimmedSearch } })
    }

    for (const fieldKey of searchFields) {
      const field = list.fields[fieldKey]
      conditions.push({
        [field.path]: {
          contains: trimmedSearch,
          mode: field.search === "insensitive" ? "insensitive" : undefined
        }
      })
    }

    return { OR: conditions }
  }, [search, list, searchFields])
}

const idFieldAlias = "____id____"

const labelFieldAlias = "____label____"

const LoadingIndicatorContext = createContext({
  count: 0,
  ref: () => {}
})

export const RelationshipSelect = ({
  autoFocus,
  controlShouldRenderValue,
  isDisabled,
  isLoading,
  labelField,
  searchFields,
  list,
  placeholder,
  portalMenu,
  state,
  extraSelection = ""
}) => {
  const [search, setSearch] = useState("")
  // note it's important that this is in state rather than a ref
  // because we want a re-render if the element changes
  // so that we can register the intersection observer
  // on the right element
  const [loadingIndicatorElement, setLoadingIndicatorElement] = useState(null)

  const QUERY = gql`
    query RelationshipSelect($where: ${list.gqlNames.whereInputName}!, $take: Int!, $skip: Int!) {
      items: ${list.gqlNames.listQueryName}(where: $where, take: $take, skip: $skip) {
        ${idFieldAlias}: id
        ${labelFieldAlias}: ${labelField}
        ${extraSelection}
      }
      count: ${list.gqlNames.listQueryCountName}(where: $where)
    }
  `

  const debouncedSearch = useDebouncedValue(search, 200)
  const where = useFilter(debouncedSearch, list, searchFields)

  const link = useApolloClient().link
  // we're using a local apollo client here because writing a global implementation of the typePolicies
  // would require making assumptions about how pagination should work which won't always be right
  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        link,
        cache: new InMemoryCache({
          typePolicies: {
            Query: {
              fields: {
                [list.gqlNames.listQueryName]: {
                  keyArgs: ["where"],
                  merge: (existing, incoming, { args }) => {
                    const merged = existing ? existing.slice() : []
                    const { skip } = args
                    for (let i = 0; i < incoming.length; ++i) {
                      merged[skip + i] = incoming[i]
                    }
                    return merged
                  }
                }
              }
            }
          }
        })
      }),
    [link, list.gqlNames.listQueryName]
  )

  const initialItemsToLoad = Math.min(list.pageSize, 10)
  const subsequentItemsToLoad = Math.min(list.pageSize, 50)
  const { data, error, loading, fetchMore } = useQuery(QUERY, {
    fetchPolicy: "network-only",
    variables: { where, take: initialItemsToLoad, skip: 0 },
    client: apolloClient
  })

  const count = data?.count || 0

  const options =
    data?.items?.map(
      ({ [idFieldAlias]: value, [labelFieldAlias]: label, ...data }) => ({
        value,
        label: label || value,
        data
      })
    ) || []

  const loadingIndicatorContextVal = useMemo(
    () => ({
      count,
      ref: setLoadingIndicatorElement
    }),
    [count]
  )

  // we want to avoid fetching more again and `loading` from Apollo
  // doesn't seem to become true when fetching more
  const [lastFetchMore, setLastFetchMore] = useState(null)

  useIntersectionObserver(
    ([{ isIntersecting }]) => {
      const skip = data?.items.length
      if (
        !loading &&
        skip &&
        isIntersecting &&
        options.length < count &&
        (lastFetchMore?.extraSelection !== extraSelection ||
          lastFetchMore?.where !== where ||
          lastFetchMore?.list !== list ||
          lastFetchMore?.skip !== skip)
      ) {
        const QUERY = gql`
            query RelationshipSelectMore($where: ${list.gqlNames.whereInputName}!, $take: Int!, $skip: Int!) {
              items: ${list.gqlNames.listQueryName}(where: $where, take: $take, skip: $skip) {
                ${labelFieldAlias}: ${labelField}
                ${idFieldAlias}: id
                ${extraSelection}
              }
            }
          `
        setLastFetchMore({ extraSelection, list, skip, where })
        fetchMore({
          query: QUERY,
          variables: {
            where,
            take: subsequentItemsToLoad,
            skip
          }
        })
          .then(() => {
            setLastFetchMore(null)
          })
          .catch(() => {
            setLastFetchMore(null)
          })
      }
    },
    { current: loadingIndicatorElement }
  )

  // TODO: better error UI
  // TODO: Handle permission errors
  // (ie; user has permission to read this relationship field, but
  // not the related list, or some items on the list)
  if (error) {
    return <span>Error</span>
  }

  if (state.kind === "one") {
    return (
      <LoadingIndicatorContext.Provider value={loadingIndicatorContextVal}>
        <Select
          // this is necessary because react-select passes a second argument to onInputChange
          // and useState setters log a warning if a second argument is passed
          onInputChange={val => setSearch(val)}
          isLoading={loading || isLoading}
          autoFocus={autoFocus}
          components={relationshipSelectComponents}
          portalMenu={portalMenu}
          value={
            state.value
              ? {
                  value: state.value.id,
                  label: state.value.label,
                  // @ts-ignore
                  data: state.value.data
                }
              : null
          }
          options={options}
          onChange={value => {
            state.onChange(
              value
                ? {
                    id: value.value,
                    label: value.label,
                    data: value.data
                  }
                : null
            )
          }}
          placeholder={placeholder}
          controlShouldRenderValue={controlShouldRenderValue}
          isClearable={controlShouldRenderValue}
          isDisabled={isDisabled}
        />
      </LoadingIndicatorContext.Provider>
    )
  }

  return (
    <LoadingIndicatorContext.Provider value={loadingIndicatorContextVal}>
      <MultiSelect
        // and useState setters log a warning if a second argument is passed
        onInputChange={val => setSearch(val)}
        isLoading={loading || isLoading}
        autoFocus={autoFocus}
        components={relationshipSelectComponents}
        portalMenu={portalMenu}
        value={state.value.map(value => ({
          value: value.id,
          label: value.label,
          data: value.data
        }))}
        options={options}
        onChange={value => {
          state.onChange(
            value.map(x => ({ id: x.value, label: x.label, data: x.data }))
          )
        }}
        placeholder={placeholder}
        controlShouldRenderValue={controlShouldRenderValue}
        isClearable={controlShouldRenderValue}
        isDisabled={isDisabled}
      />
    </LoadingIndicatorContext.Provider>
  )
}

const relationshipSelectComponents = {
  MenuList: ({ children, ...props }) => {
    const { count, ref } = useContext(LoadingIndicatorContext)
    return (
      <selectComponents.MenuList {...props}>
        {children}
        <div css={{ textAlign: "center" }} ref={ref}>
          {props.options.length < count && (
            <span css={{ padding: 8 }}>Loading...</span>
          )}
        </div>
      </selectComponents.MenuList>
    )
  }
}
