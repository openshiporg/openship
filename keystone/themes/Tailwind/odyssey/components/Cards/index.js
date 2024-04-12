import { useEffect, useRef, useState } from "react";

import { LoadingIcon } from "@keystone/components/LoadingIcon";
import { InlineEdit } from "@keystone/components/InlineEdit";
import { InlineCreate } from "@keystone/components/InlineCreate";
import { RelationshipSelect } from "@keystone/components/RelationshipSelect";

import { forwardRefWithAs } from "@keystone/utils/forwardRefWithAs";
import { useItemState } from "@keystone/utils/useItemState";

import { gql, useApolloClient } from "@keystone-6/core/admin-ui/apollo";

import {
  getRootGraphQLFieldsFromFieldController,
  makeDataGetter,
} from "@keystone-6/core/admin-ui/utils";
import { AdminLink } from "@keystone/components/AdminLink";
import { Button } from "@keystone/primitives/default/ui/button";
import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldLabel } from "@keystone/components/FieldLabel";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@keystone/primitives/default/ui/tooltip";

const CardContainer = forwardRefWithAs(({ mode = "view", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className="pl-8 relative before:content-[' '] before:bg-blue-500 before:rounded-full before:w-1 before:h-full before:absolute before:left-0 before:top-0 before:bottom-0 before:z-10"
      {...props}
    />
  );
});

export function Cards({
  localList,
  field,
  foreignList,
  id,
  value,
  onChange,
  forceValidation,
}) {
  const { displayOptions } = value;
  let selectedFields = [
    ...new Set([
      ...displayOptions.cardFields,
      ...(displayOptions.inlineEdit?.fields || []),
    ]),
  ]
    .map((fieldPath) => {
      return foreignList.fields[fieldPath].controller.graphqlSelection;
    })
    .join("\n");
  if (!displayOptions.cardFields.includes("id")) {
    selectedFields += "\nid";
  }
  if (
    !displayOptions.cardFields.includes(foreignList.labelField) &&
    foreignList.labelField !== "id"
  ) {
    selectedFields += `\n${foreignList.labelField}`;
  }

  const {
    items,
    setItems,
    state: itemsState,
  } = useItemState({
    selectedFields,
    localList,
    id,
    field,
  });

  const client = useApolloClient();

  const [isLoadingLazyItems, setIsLoadingLazyItems] = useState(false);
  const [showConnectItems, setShowConnectItems] = useState(false);
  const [hideConnectItemsLabel, setHideConnectItemsLabel] = useState("Cancel");
  const editRef = useRef(null);

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  });

  useEffect(() => {
    if (value.itemsBeingEdited) {
      editRef?.current?.focus();
    }
  }, [value]);

  if (itemsState.kind === "loading") {
    return (
      <div>
        <LoadingIcon label={`Loading items for ${field.label} field`} />
      </div>
    );
  }
  if (itemsState.kind === "error") {
    return (
      <span className="text-red-600 dark:text-red-500">
        {itemsState.message}
      </span>
    );
  }

  const currentIdsArrayWithFetchedItems = [...value.currentIds]
    .map((id) => ({ itemGetter: items[id], id }))
    .filter((x) => x.itemGetter);

  return (
    <div className="space-y-4">
      {currentIdsArrayWithFetchedItems.length !== 0 && (
        <ul className="list-none p-0 m-0 space-y-4">
          {currentIdsArrayWithFetchedItems.map(({ id, itemGetter }, index) => {
            const isEditMode =
              !!(onChange !== undefined) && value.itemsBeingEdited.has(id);
            return (
              <CardContainer
                role="status"
                mode={isEditMode ? "edit" : "view"}
                key={id}
              >
                <h2 className="sr-only">{`${field.label} ${index + 1} ${
                  isEditMode ? "edit" : "view"
                } mode`}</h2>
                {isEditMode ? (
                  <InlineEdit
                    list={foreignList}
                    fields={displayOptions.inlineEdit.fields}
                    onSave={(newItemGetter) => {
                      setItems({
                        ...items,
                        [id]: newItemGetter,
                      });
                      const itemsBeingEdited = new Set(value.itemsBeingEdited);
                      itemsBeingEdited.delete(id);
                      onChange({
                        ...value,
                        itemsBeingEdited,
                      });
                    }}
                    selectedFields={selectedFields}
                    itemGetter={itemGetter}
                    onCancel={() => {
                      const itemsBeingEdited = new Set(value.itemsBeingEdited);
                      itemsBeingEdited.delete(id);
                      onChange({
                        ...value,
                        itemsBeingEdited,
                      });
                    }}
                  />
                ) : (
                  <div className="space-y-10">
                    {displayOptions.cardFields.map((fieldPath) => {
                      const field = foreignList.fields[fieldPath];
                      const itemForField = {};
                      for (const graphqlField of getRootGraphQLFieldsFromFieldController(
                        field.controller
                      )) {
                        const fieldGetter = itemGetter.get(graphqlField);
                        if (fieldGetter.errors) {
                          const errorMessage = fieldGetter.errors[0].message;
                          return (
                            <FieldContainer>
                              <FieldLabel>{field.label}</FieldLabel>
                              {errorMessage}
                            </FieldContainer>
                          );
                        }
                        itemForField[graphqlField] = fieldGetter.data;
                      }
                      return (
                        <field.views.CardValue
                          key={fieldPath}
                          field={field.controller}
                          item={itemForField}
                        />
                      );
                    })}
                    <div className="flex space-x-2">
                      {displayOptions.inlineEdit && onChange !== undefined && (
                        <Button
                          disabled={onChange === undefined}
                          onClick={() => {
                            onChange({
                              ...value,
                              itemsBeingEdited: new Set([
                                ...value.itemsBeingEdited,
                                id,
                              ]),
                            });
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      {displayOptions.removeMode === "disconnect" &&
                        onChange !== undefined && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Button
                                disabled={onChange === undefined}
                                onClick={() => {
                                  const currentIds = new Set(value.currentIds);
                                  currentIds.delete(id);
                                  onChange({
                                    ...value,
                                    currentIds,
                                  });
                                }}
                                {...props}
                              >
                                Remove
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {/* Content of the tooltip */}
                              This item will not be deleted. It will only be
                              removed from this field.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      {displayOptions.linkToItem && (
                        <AdminLink href={`/${foreignList.path}/${id}`}>
                          <Button>View {foreignList.singular} details</Button>
                        </AdminLink>
                      )}
                    </div>
                  </div>
                )}
              </CardContainer>
            );
          })}
        </ul>
      )}
      {onChange === undefined ? null : displayOptions.inlineConnect &&
        showConnectItems ? (
        <CardContainer mode="edit">
          <div className="flex space-x-2 w-full justify-between">
            <RelationshipSelect
              autoFocus
              controlShouldRenderValue={isLoadingLazyItems}
              isDisabled={onChange === undefined}
              list={foreignList}
              labelField={field.refLabelField}
              searchFields={field.refSearchFields}
              isLoading={isLoadingLazyItems}
              placeholder={`Select a ${foreignList.singular}`}
              portalMenu
              state={{
                kind: "many",
                async onChange(options) {
                  // TODO: maybe use the extraSelection prop on RelationshipSelect here
                  const itemsToFetchAndConnect = [];
                  options.forEach((item) => {
                    if (!value.currentIds.has(item.id)) {
                      itemsToFetchAndConnect.push(item.id);
                    }
                  });
                  if (itemsToFetchAndConnect.length) {
                    try {
                      const { data, errors } = await client.query({
                        query: gql`query ($ids: [ID!]!) {
                      items: ${foreignList.gqlNames.listQueryName}(where: { id: { in: $ids }}) {
                        ${selectedFields}
                      }
                    }`,
                        variables: { ids: itemsToFetchAndConnect },
                      });
                      if (isMountedRef.current) {
                        const dataGetters = makeDataGetter(data, errors);
                        const itemsDataGetter = dataGetters.get("items");
                        let newItems = { ...items };
                        let newCurrentIds = field.many
                          ? new Set(value.currentIds)
                          : new Set();
                        if (Array.isArray(itemsDataGetter.data)) {
                          itemsDataGetter.data.forEach((item, i) => {
                            if (item?.id != null) {
                              newCurrentIds.add(item.id);
                              newItems[item.id] = itemsDataGetter.get(i);
                            }
                          });
                        }
                        if (newCurrentIds.size) {
                          setItems(newItems);
                          onChange({
                            ...value,
                            currentIds: newCurrentIds,
                          });
                          setHideConnectItemsLabel("Done");
                        }
                      }
                    } finally {
                      if (isMountedRef.current) {
                        setIsLoadingLazyItems(false);
                      }
                    }
                  }
                },
                value: (() => {
                  let options = [];
                  Object.keys(items).forEach((id) => {
                    if (value.currentIds.has(id)) {
                      options.push({ id, label: id });
                    }
                  });
                  return options;
                })(),
              }}
            />
            <Button onClick={() => setShowConnectItems(false)}>
              {hideConnectItemsLabel}
            </Button>
          </div>
        </CardContainer>
      ) : value.itemBeingCreated ? (
        <CardContainer mode="create">
          <InlineCreate
            selectedFields={selectedFields}
            fields={displayOptions.inlineCreate.fields}
            list={foreignList}
            onCancel={() => {
              onChange({ ...value, itemBeingCreated: false });
            }}
            onCreate={(itemGetter) => {
              const id = itemGetter.data.id;
              setItems({ ...items, [id]: itemGetter });
              onChange({
                ...value,
                itemBeingCreated: false,
                currentIds: field.many
                  ? new Set([...value.currentIds, id])
                  : new Set([id]),
              });
            }}
          />
        </CardContainer>
      ) : displayOptions.inlineCreate || displayOptions.inlineConnect ? (
        <CardContainer mode="create">
          <div className="flex space-x-2">
            {displayOptions.inlineCreate && (
              <Button
                disabled={onChange === undefined}
                onClick={() => {
                  onChange({
                    ...value,
                    itemBeingCreated: true,
                  });
                }}
              >
                Create {foreignList.singular}
              </Button>
            )}
            {displayOptions.inlineConnect && (
              <Button
                onClick={() => {
                  setShowConnectItems(true);
                  setHideConnectItemsLabel("Cancel");
                }}
              >
                Link existing {foreignList.singular}
              </Button>
            )}
          </div>
        </CardContainer>
      ) : null}
      {/* TODO: this may not be visible to the user when they invoke the save action. Maybe scroll to it? */}
      {forceValidation && (
        <span className="text-red-600 dark:text-red-500">
          You must finish creating and editing any related{" "}
          {foreignList.label.toLowerCase()} before saving the{" "}
          {localList.singular.toLowerCase()}
        </span>
      )}
    </div>
  );
}
