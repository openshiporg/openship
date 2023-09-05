/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, Box, VisuallyHidden } from "@keystone-ui/core";
import { CheckboxControl } from "@keystone-ui/fields";
import { ArrowRightCircleIcon } from "@keystone-ui/icons/icons/ArrowRightCircleIcon";
import { AdminLink } from "@keystone/components/AdminLink";

import { useRouter, useSearchParams } from "next/navigation";

import { getRootGraphQLFieldsFromFieldController } from "@keystone-6/core/admin-ui/utils";
import { CellLink } from "@keystone/components/CellLink";
import { Pagination } from "@keystone/components/Pagination";

import { SortDirectionArrow } from "@keystone/components/SortDirectionArrow";
import { TableBodyCell } from '@keystone/components/TableBodyCell';
import { TableContainer } from "@keystone/components/TableContainer";
import { TableHeaderCell } from "@keystone/components/TableHeaderCell";
import { TableHeaderRow } from "@keystone/components/TableHeaderRow";
import { useList } from "@keystone/keystoneProvider";

export function ListTable({
  selectedFields,
  listKey,
  itemsGetter,
  count,
  sort,
  currentPage,
  pageSize,
  selectedItems,
  onSelectedItemsChange,
  orderableFields,
}) {
  const list = useList(listKey);
  // const { query } = useRouter();
  const searchParams = useSearchParams()
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  const shouldShowLinkIcon =
    !list.fields[selectedFields.keys().next().value].views.Cell.supportsLinkTo;
  return (
    <Box paddingBottom="xlarge">
      <TableContainer>
        <VisuallyHidden as="caption">{list.label} list</VisuallyHidden>
        <colgroup>
          <col width="30" />
          {shouldShowLinkIcon && <col width="30" />}
          {[...selectedFields].map((path) => (
            <col key={path} />
          ))}
        </colgroup>
        <TableHeaderRow>
          <TableHeaderCell css={{ paddingLeft: 0 }}>
            <label
              css={{
                display: "flex",
                alignItems: "center",
                justifyContent: "start",
                cursor: "pointer",
              }}
            >
              <CheckboxControl
                size="small"
                checked={selectedItems.size === itemsGetter.data?.length}
                css={{ cursor: "default" }}
                onChange={() => {
                  const newSelectedItems = new Set();
                  if (selectedItems.size !== itemsGetter.data?.length) {
                    itemsGetter.data?.forEach((item) => {
                      if (item !== null && item.id !== null) {
                        newSelectedItems.add(item.id);
                      }
                    });
                  }
                  onSelectedItemsChange(newSelectedItems);
                }}
              />
            </label>
          </TableHeaderCell>
          {shouldShowLinkIcon && <TableHeaderCell />}
          {[...selectedFields].map((path) => {
            const label = list.fields[path].label;
            if (!orderableFields.has(path)) {
              return <TableHeaderCell key={path}>{label}</TableHeaderCell>;
            }
            return (
              <TableHeaderCell key={path}>
                <AdminLink
                  css={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    ":hover": { color: "inherit" },
                  }}
                  href={{
                    query: {
                      ...query,
                      sortBy:
                        sort?.field === path && sort.direction === "ASC"
                          ? `-${path}`
                          : path,
                    },
                  }}
                >
                  {label}
                  {sort?.field === path && (
                    <SortDirectionArrow direction={sort.direction} />
                  )}
                </AdminLink>
              </TableHeaderCell>
            );
          })}
        </TableHeaderRow>
        <tbody>
          {(itemsGetter.data ?? []).map((_, index) => {
            const itemGetter = itemsGetter.get(index);
            if (itemGetter.data === null || itemGetter.data.id === null) {
              if (itemGetter.errors) {
                return (
                  <tr css={{ color: "red" }} key={`index:${index}`}>
                    {itemGetter.errors[0].message}
                  </tr>
                );
              }
              return null;
            }
            const itemId = itemGetter.data.id;
            return (
              <tr key={itemId || `index:${index}`}>
                <TableBodyCell>
                  <label
                    css={{
                      display: "flex",
                      minHeight: 38,
                      alignItems: "center",
                      justifyContent: "start",
                    }}
                  >
                    <CheckboxControl
                      size="small"
                      checked={selectedItems.has(itemId)}
                      css={{ cursor: "default" }}
                      onChange={() => {
                        const newSelectedItems = new Set(selectedItems);
                        if (selectedItems.has(itemId)) {
                          newSelectedItems.delete(itemId);
                        } else {
                          newSelectedItems.add(itemId);
                        }
                        onSelectedItemsChange(newSelectedItems);
                      }}
                    />
                  </label>
                </TableBodyCell>
                {shouldShowLinkIcon && (
                  <TableBodyCell>
                    <AdminLink
                      css={{
                        textDecoration: "none",
                        minHeight: 38,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      href={`/${list.path}/[id]`}
                      as={`/${list.path}/${encodeURIComponent(itemId)}`}
                    >
                      <ArrowRightCircleIcon
                        size="smallish"
                        aria-label="Go to item"
                      />
                    </AdminLink>
                  </TableBodyCell>
                )}
                {[...selectedFields].map((path, i) => {
                  const field = list.fields[path];
                  let { Cell } = list.fields[path].views;
                  const itemForField = {};
                  for (const graphqlField of getRootGraphQLFieldsFromFieldController(
                    field.controller
                  )) {
                    const fieldGetter = itemGetter.get(graphqlField);
                    if (fieldGetter.errors) {
                      const errorMessage = fieldGetter.errors[0].message;
                      return (
                        <TableBodyCell css={{ color: "red" }} key={path}>
                          {i === 0 && Cell.supportsLinkTo ? (
                            <CellLink
                              href={`/${list.path}/[id]`}
                              as={`/${list.path}/${encodeURIComponent(itemId)}`}
                            >
                              {errorMessage}
                            </CellLink>
                          ) : (
                            errorMessage
                          )}
                        </TableBodyCell>
                      );
                    }
                    itemForField[graphqlField] = fieldGetter.data;
                  }

                  return (
                    <TableBodyCell key={path}>
                      <Cell
                        field={field.controller}
                        item={itemForField}
                        linkTo={
                          i === 0 && Cell.supportsLinkTo
                            ? {
                                href: `/${list.path}/${encodeURIComponent(
                                  itemId
                                )}`,
                                // as: `/${list.path}/${encodeURIComponent(
                                //   itemId
                                // )}`,
                              }
                            : undefined
                        }
                      />
                    </TableBodyCell>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </TableContainer>
      <Pagination
        list={list}
        total={count}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </Box>
  );
}
