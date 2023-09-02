/** @jsxRuntime classic */
/** @jsx jsx */

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";

import { Button } from "@keystone-ui/button";
import { jsx, Center, Stack, useTheme } from "@keystone-ui/core";
import { TextInput } from "@keystone-ui/fields";
import { LoadingDots } from "@keystone-ui/loading";

import { SearchIcon } from "@keystone-ui/icons/icons/SearchIcon";

import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
// import { HEADER_HEIGHT } from "@keystone-6/core/dist/declarations/src/admin-ui/components/PageContainer";
// import { PaginationLabel } from "@keystone-6/core/dist/declarations/src/admin-ui/components/Pagination";

import { CreateButtonLink } from "@keystone/components/CreateButtonLink";
import { DeleteManyButton } from "@keystone/components/DeleteManyButton";
import { FieldSelection } from "@keystone/components/FieldSelection";
import { FilterAdd } from "@keystone/components/FilterAdd";
import { FilterList } from "@keystone/components/FilterList";
import { ListPageHeader } from "@keystone/components/ListPageHeader";
import { ListTable } from "@keystone/components/ListTable";
import { ResultsSummaryContainer } from "@keystone/components/ResultsSummaryContainer";
import { SortSelection } from "@keystone/components/SortSelection";
import { useList } from "@keystone/keystoneProvider";
import { useFilter } from "@keystone/utils/useFilter";
import { useFilters } from "@keystone/utils/useFilters";
import { useQueryParamsFromLocalStorage } from "@keystone/utils/useQueryParamsFromLocalStorage";
import { useSelectedFields } from "@keystone/utils/useSelectedFields";
import { useSort } from "@keystone/utils/useSort";
import { PageContainer } from "@keystone/components/PageContainer";
import { PaginationLabel } from "@keystone/components/Pagination";
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";

const HEADER_HEIGHT = 80;

let listMetaGraphqlQuery = gql`
  query ($listKey: String!) {
    keystone {
      adminMeta {
        list(key: $listKey) {
          hideDelete
          hideCreate
          fields {
            path
            isOrderable
            isFilterable
            listView {
              fieldMode
            }
          }
        }
      }
    }
  }
`;

export const storeableQueries = ["sortBy", "fields"];

export const ListPage = ({ params }) => {
  const listKey = params.listKey;
  const listsObject = {};
  for (const [key, list] of Object.entries(models)) {
    const { adminUILabels } = getNamesFromList(key, list);
    listsObject[adminUILabels.path] = key;
  }
  const key = listsObject[listKey];

  return <ListPageTemplate listKey={key} />;
};

export const ListPageTemplate = ({ listKey }) => {
  const list = useList(listKey);

  const { push } = useRouter();
  const searchParams = useSearchParams();

  // Create a query object that behaves like the old query object
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const { resetToDefaults } = useQueryParamsFromLocalStorage(listKey);

  const currentPage =
    typeof query.page === "string" && !Number.isNaN(parseInt(query.page))
      ? Number(query.page)
      : 1;
  const pageSize =
    typeof query.pageSize === "string" &&
    !Number.isNaN(parseInt(query.pageSize))
      ? parseInt(query.pageSize)
      : list.pageSize;

  const metaQuery = useQuery(listMetaGraphqlQuery, { variables: { listKey } });

  let { listViewFieldModesByField, filterableFields, orderableFields } =
    useMemo(() => {
      const listViewFieldModesByField = {};
      const orderableFields = new Set();
      const filterableFields = new Set();
      for (const field of metaQuery.data?.keystone.adminMeta.list?.fields ||
        []) {
        listViewFieldModesByField[field.path] = field.listView.fieldMode;
        if (field.isOrderable) {
          orderableFields.add(field.path);
        }
        if (field.isFilterable) {
          filterableFields.add(field.path);
        }
      }

      return { listViewFieldModesByField, orderableFields, filterableFields };
    }, [metaQuery.data?.keystone.adminMeta.list?.fields]);

  const sort = useSort(list, orderableFields);
  const filters = useFilters(list, filterableFields);

  const searchFields = Object.keys(list.fields).filter(
    (key) => list.fields[key].search
  );
  const searchLabels = searchFields.map((key) => list.fields[key].label);

  const searchParam = typeof query.search === "string" ? query.search : "";
  const [searchString, updateSearchString] = useState(searchParam);
  const search = useFilter(searchParam, list, searchFields);

  const updateSearch = (value) => {
    const { search, ...queries } = query;

    if (value.trim()) {
      push({ query: { ...queries, search: value } });
    } else {
      push({ query: queries });
    }
  };

  let selectedFields = useSelectedFields(list, listViewFieldModesByField);

  let {
    data: newData,
    error: newError,
    refetch,
  } = useQuery(
    useMemo(() => {
      let selectedGqlFields = [...selectedFields]
        .map((fieldPath) => {
          return list.fields[fieldPath].controller.graphqlSelection;
        })
        .join("\n");
      return gql`
    query ($where: ${
      list.gqlNames.whereInputName
    }, $take: Int!, $skip: Int!, $orderBy: [${list.gqlNames.listOrderName}!]) {
      items: ${
        list.gqlNames.listQueryName
      }(where: $where,take: $take, skip: $skip, orderBy: $orderBy) {
        ${
          // TODO: maybe namespace all the fields instead of doing this
          selectedFields.has("id") ? "" : "id"
        }
        ${selectedGqlFields}
      }
      count: ${list.gqlNames.listQueryCountName}(where: $where)
    }
  `;
    }, [list, selectedFields]),
    {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      skip: !metaQuery.data,
      variables: {
        where: { ...filters.where, ...search },
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
        orderBy: sort
          ? [{ [sort.field]: sort.direction.toLowerCase() }]
          : undefined,
      },
    }
  );

  let [dataState, setDataState] = useState({ data: newData, error: newError });

  if (newData && dataState.data !== newData) {
    setDataState({ data: newData, error: newError });
  }

  const { data, error } = dataState;

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  const [selectedItemsState, setSelectedItems] = useState(() => ({
    itemsFromServer: undefined,
    selectedItems: new Set(),
  }));

  // this removes the selected items which no longer exist when the data changes
  // because someone goes to another page, changes filters or etc.
  if (data && data.items && selectedItemsState.itemsFromServer !== data.items) {
    const newSelectedItems = new Set();
    data.items.forEach((item) => {
      if (selectedItemsState.selectedItems.has(item.id)) {
        newSelectedItems.add(item.id);
      }
    });
    setSelectedItems({
      itemsFromServer: data.items,
      selectedItems: newSelectedItems,
    });
  }

  const theme = useTheme();
  const showCreate =
    !(metaQuery.data?.keystone.adminMeta.list?.hideCreate ?? true) || null;

  const selectedItemsPagination = () => {
    const selectedItems = selectedItemsState.selectedItems;
    const selectedItemsCount = selectedItems.size;
    if (selectedItemsCount) {
      return (
        <Fragment>
          <span css={{ marginRight: theme.spacing.small }}>
            Selected {selectedItemsCount} of {data.items.length}
          </span>
          {!(metaQuery.data?.keystone.adminMeta.list?.hideDelete ?? true) && (
            <DeleteManyButton
              list={list}
              selectedItems={selectedItems}
              refetch={refetch}
            />
          )}
        </Fragment>
      );
    }
    return (
      <Fragment>
        <PaginationLabel
          currentPage={currentPage}
          pageSize={pageSize}
          plural={list.plural}
          singular={list.singular}
          total={data.count}
        />
        , sorted by{" "}
        <SortSelection list={list} orderableFields={orderableFields} />
        with{" "}
        <FieldSelection
          list={list}
          fieldModesByFieldPath={listViewFieldModesByField}
        />{" "}
      </Fragment>
    );
  };
  return (
    <PageContainer
      header={<ListPageHeader listKey={listKey} />}
      title={list.label}
    >
      {metaQuery.error ? (
        // TODO: Show errors nicely and with information
        "Error..."
      ) : data && metaQuery.data ? (
        <Fragment>
          {list.description !== null && (
            <p css={{ marginTop: "24px", maxWidth: "704px" }}>
              {list.description}
            </p>
          )}
          <Stack across gap="medium" align="center" marginTop="xlarge">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSearch(searchString);
              }}
            >
              <Stack across>
                <TextInput
                  css={{ borderRadius: "4px 0px 0px 4px" }}
                  autoFocus
                  value={searchString}
                  onChange={(e) => updateSearchString(e.target.value)}
                  placeholder={`Search by ${
                    searchLabels.length ? searchLabels.join(", ") : "ID"
                  }`}
                />
                <Button css={{ borderRadius: "0px 4px 4px 0px" }} type="submit">
                  <SearchIcon />
                </Button>
              </Stack>
            </form>
            {showCreate && <CreateButtonLink list={list} />}
            {data.count || filters.filters.length ? (
              <FilterAdd
                listKey={listKey}
                filterableFields={filterableFields}
              />
            ) : null}
            {filters.filters.length ? (
              <FilterList filters={filters.filters} list={list} />
            ) : null}
            {Boolean(
              filters.filters.length ||
                query.sortBy ||
                query.fields ||
                query.search
            ) && (
              <Button size="small" onClick={resetToDefaults}>
                Reset to defaults
              </Button>
            )}
          </Stack>
          {data.count ? (
            <Fragment>
              <ResultsSummaryContainer>
                {selectedItemsPagination()}
              </ResultsSummaryContainer>
              <ListTable
                count={data.count}
                currentPage={currentPage}
                itemsGetter={dataGetter.get("items")}
                listKey={listKey}
                pageSize={pageSize}
                selectedFields={selectedFields}
                sort={sort}
                selectedItems={selectedItemsState.selectedItems}
                onSelectedItemsChange={(selectedItems) => {
                  setSelectedItems({
                    itemsFromServer: selectedItemsState.itemsFromServer,
                    selectedItems,
                  });
                }}
                orderableFields={orderableFields}
              />
            </Fragment>
          ) : (
            <ResultsSummaryContainer>
              No {list.plural} found.
            </ResultsSummaryContainer>
          )}
        </Fragment>
      ) : (
        <Center css={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <LoadingDots label="Loading item data" size="large" tone="passive" />
        </Center>
      )}
    </PageContainer>
  );
};
