import { AdminLink } from "@keystone/components/AdminLink";

import { Fragment, useState } from "react";

import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";

import { CellContainer } from "@keystone/components/CellContainer";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { FieldLegend } from "@keystone/components/FieldLegend";
import { useKeystone, useList } from "@keystone/keystoneProvider";

import { Cards } from "@keystone/components/Cards";
import { CreateItemDrawer } from "@keystone/components/CreateItemDrawer";
import { RelationshipSelect } from "@keystone/components/RelationshipSelect";
import { Button } from "@keystone/primitives/default/ui/button";

function LinkToRelatedItems({ itemId, value, list, refFieldKey }) {
  function constructQuery({ refFieldKey, itemId, value }) {
    if (!!refFieldKey && itemId) {
      return `!${refFieldKey}_matches="${itemId}"`;
    }
    return `!id_in="${(value?.value)
      .slice(0, 100)
      .map(({ id }) => id)
      .join(",")}"`;
  }
  if (value.kind === "many") {
    const query = constructQuery({ refFieldKey, value, itemId });
    return (
      <Button variant="link">
        <AdminLink href={`/${list.path}?${query}`}>
          View related {list.plural}
        </AdminLink>
      </Button>
    );
  }

  return (
    <AdminLink href={`/${list.path}/${value.value?.id}`}>
      <Button variant="link" size="sm">
        View {list.singular} details
      </Button>
    </AdminLink>
  );
}

export const Field = ({
  field,
  autoFocus,
  value,
  onChange,
  forceValidation,
}) => {
  const keystone = useKeystone();
  const foreignList = useList(field.refListKey);
  const localList = useList(field.listKey);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (value.kind === "cards-view") {
    return (
      <FieldContainer as="fieldset">
        <FieldLegend>{field.label}</FieldLegend>
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
        <Cards
          forceValidation={forceValidation}
          field={field}
          id={value.id}
          value={value}
          onChange={onChange}
          foreignList={foreignList}
          localList={localList}
        />
      </FieldContainer>
    );
  }

  if (value.kind === "count") {
    return (
      <fieldset className="space-y-4">
        <FieldLegend>{field.label}</FieldLegend>
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
        <div>
          {value.count === 1
            ? `There is 1 ${foreignList.singular} `
            : `There are ${value.count} ${foreignList.plural} `}
          linked to this {localList.singular}
        </div>
      </fieldset>
    );
  }

  const authenticatedItem = keystone.authenticatedItem;

  return (
    <FieldContainer as="fieldset">
      <FieldLabel as="legend">{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <Fragment>
        <div className="space-y-4">
          <RelationshipSelect
            controlShouldRenderValue
            aria-describedby={
              field.description === null
                ? undefined
                : `${field.path}-description`
            }
            autoFocus={autoFocus}
            isDisabled={onChange === undefined}
            labelField={field.refLabelField}
            searchFields={field.refSearchFields}
            list={foreignList}
            portalMenu
            state={
              value.kind === "many"
                ? {
                    kind: "many",
                    value: value.value,
                    onChange(newItems) {
                      onChange?.({
                        ...value,
                        value: newItems,
                      });
                    },
                  }
                : {
                    kind: "one",
                    value: value.value,
                    onChange(newVal) {
                      if (value.kind === "one") {
                        onChange?.({
                          ...value,
                          value: newVal,
                        });
                      }
                    },
                  }
            }
          />
          <div className="flex space-x-2">
            {onChange !== undefined &&
              !field.hideCreate &&
              onChange !== undefined && (
                <CreateItemDrawer
                  listKey={foreignList.key}
                  trigger={
                    <Button
                      size="sm"
                      // disabled={isDrawerOpen}
                      // onClick={() => {
                      //   setIsDrawerOpen(true);
                      // }}
                      variant="secondary"
                    >
                      Create related {foreignList.singular}
                    </Button>
                  }
                  onClose={() => {
                    setIsDrawerOpen(false);
                  }}
                  onCreate={(val) => {
                    setIsDrawerOpen(false);
                    if (value.kind === "many") {
                      onChange({
                        ...value,
                        value: [...value.value, val],
                      });
                    } else if (value.kind === "one") {
                      onChange({
                        ...value,
                        value: val,
                      });
                    }
                  }}
                />
              )}
            {onChange !== undefined &&
              authenticatedItem.state === "authenticated" &&
              authenticatedItem.listKey === field.refListKey &&
              (value.kind === "many"
                ? value.value.find((x) => x.id === authenticatedItem.id) ===
                  undefined
                : value.value?.id !== authenticatedItem.id) && (
                <Button
                  size="sm"
                  onClick={() => {
                    const val = {
                      label: authenticatedItem.label,
                      id: authenticatedItem.id,
                    };
                    if (value.kind === "many") {
                      onChange({
                        ...value,
                        value: [...value.value, val],
                      });
                    } else {
                      onChange({
                        ...value,
                        value: val,
                      });
                    }
                  }}
                >
                  {value.kind === "many" ? "Add " : "Set as "}
                  {authenticatedItem.label}
                </Button>
              )}
            {!!(value.kind === "many"
              ? value.value.length
              : value.kind === "one" && value.value) && (
              <LinkToRelatedItems
                itemId={value.id}
                refFieldKey={field.refFieldKey}
                list={foreignList}
                value={value}
              />
            )}
          </div>
        </div>
      </Fragment>
    </FieldContainer>
  );
};

export const Cell = ({ field, item }) => {
  const list = useList(field.refListKey);

  if (field.display === "count") {
    const count = item[`${field.path}Count`] ?? 0;
    return (
      <CellContainer>
        {count} {count === 1 ? list.singular : list.plural}
      </CellContainer>
    );
  }

  const data = item[field.path];
  const items = (Array.isArray(data) ? data : [data]).filter((item) => item);
  const displayItems = items.length < 5 ? items : items.slice(0, 3);
  const overflow = items.length < 5 ? 0 : items.length - 3;

  return (
    <CellContainer>
      {displayItems.map((item, index) => (
        <Fragment key={item.id}>
          {!!index ? ", " : ""}
          <AdminLink
            href={`/${list.path}/[id]`}
            as={`/${list.path}/${item.id}`}
          >
            {item.label || item.id}
          </AdminLink>
        </Fragment>
      ))}
      {overflow ? `, and ${overflow} more` : null}
    </CellContainer>
  );
};

export const CardValue = ({ field, item }) => {
  const list = useList(field.refListKey);
  const data = item[field.path];
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      {(Array.isArray(data) ? data : [data])
        .filter((item) => item)
        .map((item, index) => (
          <Fragment key={item.id}>
            {!!index ? ", " : ""}
            <AdminLink
              href={`/${list.path}/[id]`}
              as={`/${list.path}/${item.id}`}
            >
              {item.label || item.id}
            </AdminLink>
          </Fragment>
        ))}
    </FieldContainer>
  );
};

export const controller = (config) => {
  const cardsDisplayOptions =
    config.fieldMeta.displayMode === "cards"
      ? {
          cardFields: config.fieldMeta.cardFields,
          inlineCreate: config.fieldMeta.inlineCreate,
          inlineEdit: config.fieldMeta.inlineEdit,
          linkToItem: config.fieldMeta.linkToItem,
          removeMode: config.fieldMeta.removeMode,
          inlineConnect: config.fieldMeta.inlineConnect,
        }
      : undefined;

  const refLabelField = config.fieldMeta.refLabelField;
  const refSearchFields = config.fieldMeta.refSearchFields;

  return {
    refFieldKey: config.fieldMeta.refFieldKey,
    many: config.fieldMeta.many,
    listKey: config.listKey,
    path: config.path,
    label: config.label,
    description: config.description,
    display:
      config.fieldMeta.displayMode === "count" ? "count" : "cards-or-select",
    refLabelField,
    refSearchFields,
    refListKey: config.fieldMeta.refListKey,
    graphqlSelection:
      config.fieldMeta.displayMode === "count"
        ? `${config.path}Count`
        : `${config.path} {
              id
              label: ${refLabelField}
            }`,
    hideCreate: config.fieldMeta.hideCreate,
    // note we're not making the state kind: 'count' when ui.displayMode is set to 'count'.
    // that ui.displayMode: 'count' is really just a way to have reasonable performance
    // because our other UIs don't handle relationships with a large number of items well
    // but that's not a problem here since we're creating a new item so we might as well them a better UI
    defaultValue:
      cardsDisplayOptions !== undefined
        ? {
            kind: "cards-view",
            currentIds: new Set(),
            id: null,
            initialIds: new Set(),
            itemBeingCreated: false,
            itemsBeingEdited: new Set(),
            displayOptions: cardsDisplayOptions,
          }
        : config.fieldMeta.many
        ? {
            id: null,
            kind: "many",
            initialValue: [],
            value: [],
          }
        : { id: null, kind: "one", value: null, initialValue: null },
    deserialize: (data) => {
      if (config.fieldMeta.displayMode === "count") {
        return {
          id: data.id,
          kind: "count",
          count: data[`${config.path}Count`] ?? 0,
        };
      }
      if (cardsDisplayOptions !== undefined) {
        const initialIds = new Set(
          (Array.isArray(data[config.path])
            ? data[config.path]
            : data[config.path]
            ? [data[config.path]]
            : []
          ).map((x) => x.id)
        );
        return {
          kind: "cards-view",
          id: data.id,
          itemsBeingEdited: new Set(),
          itemBeingCreated: false,
          initialIds,
          currentIds: initialIds,
          displayOptions: cardsDisplayOptions,
        };
      }
      if (config.fieldMeta.many) {
        let value = (data[config.path] || []).map((x) => ({
          id: x.id,
          label: x.label || x.id,
        }));
        return {
          kind: "many",
          id: data.id,
          initialValue: value,
          value,
        };
      }
      let value = data[config.path];
      if (value) {
        value = {
          id: value.id,
          label: value.label || value.id,
        };
      }
      return {
        kind: "one",
        id: data.id,
        value,
        initialValue: value,
      };
    },
    filter: {
      Filter: ({ onChange, value }) => {
        const foreignList = useList(config.fieldMeta.refListKey);
        const { filterValues, loading } = useRelationshipFilterValues({
          value,
          list: foreignList,
        });
        const state = {
          kind: "many",
          value: filterValues,
          onChange(newItems) {
            onChange(newItems.map((item) => item.id).join(","));
          },
        };
        return (
          <RelationshipSelect
            controlShouldRenderValue
            list={foreignList}
            labelField={refLabelField}
            searchFields={refSearchFields}
            isLoading={loading}
            isDisabled={onChange === undefined}
            state={state}
          />
        );
      },
      graphql: ({ value }) => {
        const foreignIds = getForeignIds(value);
        if (config.fieldMeta.many) {
          return {
            [config.path]: {
              some: {
                id: {
                  in: foreignIds,
                },
              },
            },
          };
        }
        return {
          [config.path]: {
            id: {
              in: foreignIds,
            },
          },
        };
      },
      Label({ value }) {
        const foreignList = useList(config.fieldMeta.refListKey);
        const { filterValues } = useRelationshipFilterValues({
          value,
          list: foreignList,
        });

        if (!filterValues.length) {
          return `has no value`;
        }
        if (filterValues.length > 1) {
          const values = filterValues.map((i) => i.label).join(", ");
          return `is in [${values}]`;
        }
        const optionLabel = filterValues[0].label;
        return `is ${optionLabel}`;
      },
      types: {
        matches: {
          label: "Matches",
          initialValue: "",
        },
      },
    },
    validate(value) {
      return (
        value.kind !== "cards-view" ||
        (value.itemsBeingEdited.size === 0 && !value.itemBeingCreated)
      );
    },
    serialize: (state) => {
      if (state.kind === "many") {
        const newAllIds = new Set(state.value.map((x) => x.id));
        const initialIds = new Set(state.initialValue.map((x) => x.id));
        let disconnect = state.initialValue
          .filter((x) => !newAllIds.has(x.id))
          .map((x) => ({ id: x.id }));
        let connect = state.value
          .filter((x) => !initialIds.has(x.id))
          .map((x) => ({ id: x.id }));
        if (disconnect.length || connect.length) {
          let output = {};

          if (disconnect.length) {
            output.disconnect = disconnect;
          }

          if (connect.length) {
            output.connect = connect;
          }

          return {
            [config.path]: output,
          };
        }
      } else if (state.kind === "one") {
        if (state.initialValue && !state.value) {
          return { [config.path]: { disconnect: true } };
        } else if (state.value && state.value.id !== state.initialValue?.id) {
          return {
            [config.path]: {
              connect: {
                id: state.value.id,
              },
            },
          };
        }
      } else if (state.kind === "cards-view") {
        let disconnect = [...state.initialIds]
          .filter((id) => !state.currentIds.has(id))
          .map((id) => ({ id }));
        let connect = [...state.currentIds]
          .filter((id) => !state.initialIds.has(id))
          .map((id) => ({ id }));

        if (config.fieldMeta.many) {
          if (disconnect.length || connect.length) {
            return {
              [config.path]: {
                connect: connect.length ? connect : undefined,
                disconnect: disconnect.length ? disconnect : undefined,
              },
            };
          }
        } else if (connect.length) {
          return {
            [config.path]: {
              connect: connect[0],
            },
          };
        } else if (disconnect.length) {
          return { [config.path]: { disconnect: true } };
        }
      }
      return {};
    },
  };
};

function useRelationshipFilterValues({ value, list }) {
  const foreignIds = getForeignIds(value);
  const where = { id: { in: foreignIds } };

  const query = gql`
    query FOREIGNLIST_QUERY($where: ${list.gqlNames.whereInputName}!) {
      items: ${list.gqlNames.listQueryName}(where: $where) {
        id
        ${list.labelField}
      }
    }
  `;

  const { data, loading } = useQuery(query, {
    variables: {
      where,
    },
  });

  return {
    filterValues:
      data?.items?.map((item) => {
        return {
          id: item.id,
          label: item[list.labelField] || item.id,
        };
      }) || foreignIds.map((f) => ({ label: f, id: f })),
    loading: loading,
  };
}

function getForeignIds(value) {
  if (typeof value === "string" && value.length > 0) {
    return value.split(",");
  }
  return [];
}
