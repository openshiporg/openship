/** @jsxRuntime classic */
/** @jsx jsx */

import copyToClipboard from "clipboard-copy";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@keystone-ui/button";
import { jsx, Box, Center, Heading, Stack, Text, useTheme } from "@keystone-ui/core";
import { Notice } from "@keystone-ui/notice";
import { Tooltip } from "@keystone-ui/tooltip";

import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  deserializeValue,
  makeDataGetter,
  useChangedFieldsAndDataForUpdate,
  useInvalidFields,
} from "@keystone-6/core/admin-ui/utils";
import { Container } from "@keystone/components/Container";
import { CreateButtonLink } from "@keystone/components/CreateButtonLink";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { Fields } from "@keystone/components/Fields";
import { GraphQLErrorNotice } from "@keystone/components/GraphQLErrorNotice";
import { AlertDialog } from "@keystone/components/Modals";
import {
  HEADER_HEIGHT,
  PageContainer,
} from "@keystone/components/PageContainer";
import { TextInput } from "@keystone/components/TextInput";
import { useToasts } from "@keystone/components/Toast";
import { useList } from "@keystone/keystoneProvider";
import { usePreventNavigation } from "@keystone/utils/usePreventNavigation";
import { LoadingDots } from "@keystone-ui/loading";
import { AdminLink } from "@keystone/components/AdminLink";

import { ChevronRightIcon } from "@keystone-ui/icons/icons/ChevronRightIcon";
import { ClipboardIcon } from '@keystone-ui/icons/icons/ClipboardIcon';
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";

export function ItemPageHeader(props) {
  const { palette, spacing } = useTheme();

  return (
    <Container
      css={{
        alignItems: "center",
        display: "flex",
        flex: 1,
        justifyContent: "space-between",
      }}
    >
      <div
        css={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          minWidth: 0,
        }}
      >
        {props.list.isSingleton ? (
          <Heading type="h3">{props.list.label}</Heading>
        ) : (
          <Fragment>
            <Heading type="h3">
              <AdminLink
                href={`/${props.list.path}`}
                css={{ textDecoration: "none" }}
              >
                {props.list.label}
              </AdminLink>
            </Heading>
            <div
              css={{
                color: palette.neutral500,
                marginLeft: spacing.xsmall,
                marginRight: spacing.xsmall,
              }}
            >
              <ChevronRightIcon />
            </div>
            <Heading
              as="h1"
              type="h3"
              css={{
                minWidth: 0,
                maxWidth: "100%",
                overflow: "hidden",
                flex: 1,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {props.label}
            </Heading>
          </Fragment>
        )}
      </div>
    </Container>
  );
}

export function ColumnLayout(props) {
  const { spacing } = useTheme();

  return (
    // this container must be relative to catch absolute children
    // particularly the "expanded" document-field, which needs a height of 100%
    <Container css={{ position: "relative", height: "100%" }}>
      <div
        css={{
          alignItems: "start",
          display: "grid",
          gap: spacing.xlarge,
          gridTemplateColumns: `2fr 1fr`,
        }}
        {...props}
      />
    </Container>
  );
}

export function BaseToolbar(props) {
  const { colors, spacing } = useTheme();

  return (
    <div
      css={{
        background: colors.background,
        borderTop: `1px solid ${colors.border}`,
        bottom: 0,
        display: "flex",
        justifyContent: "space-between",
        marginTop: spacing.xlarge,
        paddingBottom: spacing.xlarge,
        paddingTop: spacing.xlarge,
        position: "sticky",
        zIndex: 20,
      }}
    >
      {props.children}
    </div>
  );
}

function useEventCallback(callback) {
  const callbackRef = useRef(callback);
  const cb = useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
  useEffect(() => {
    callbackRef.current = callback;
  });
  return cb;
}

function ItemForm({
  listKey,
  itemGetter,
  selectedFields,
  fieldModes,
  fieldPositions,
  showDelete,
  item,
}) {
  const list = useList(listKey);
  const { spacing, typography } = useTheme();

  const [update, { loading, error, data }] = useMutation(
    gql`mutation ($data: ${list.gqlNames.updateInputName}!, $id: ID!) {
    item: ${list.gqlNames.updateMutationName}(where: { id: $id }, data: $data) {
      ${selectedFields}
    }
  }`,
    { errorPolicy: "all" }
  );
  itemGetter =
    useMemo(() => {
      if (data) {
        return makeDataGetter(data, error?.graphQLErrors).get("item");
      }
    }, [data, error]) ?? itemGetter;

  const [state, setValue] = useState(() => {
    const value = deserializeValue(list.fields, itemGetter);
    return { value, item: itemGetter };
  });
  if (
    !loading &&
    state.item.data !== itemGetter.data &&
    (itemGetter.errors || []).every((x) => x.path?.length !== 1)
  ) {
    const value = deserializeValue(list.fields, itemGetter);
    setValue({ value, item: itemGetter });
  }

  const { changedFields, dataForUpdate } = useChangedFieldsAndDataForUpdate(
    list.fields,
    state.item,
    state.value
  );

  const invalidFields = useInvalidFields(list.fields, state.value);

  const [forceValidation, setForceValidation] = useState(false);
  const toasts = useToasts();
  const onSave = useEventCallback(() => {
    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);
    if (newForceValidation) return;

    update({
      variables: { data: dataForUpdate, id: state.item.get("id").data },
    })
      // TODO -- Experimenting with less detail in the toasts, so the data lines are commented
      // out below. If we're happy with this, clean up the unused lines.
      .then(({ /* data, */ errors }) => {
        // we're checking for path being undefined OR path.length === 1 because errors with a path larger than 1 will
        // be field level errors which are handled seperately and do not indicate a failure to
        // update the item, path being undefined generally indicates a failure in the graphql mutation itself - ie a type error
        const error = errors?.find(
          (x) => x.path === undefined || x.path?.length === 1
        );
        if (error) {
          toasts.addToast({
            title: "Failed to update item",
            tone: "negative",
            message: error.message,
          });
        } else {
          toasts.addToast({
            // title: data.item[list.labelField] || data.item.id,
            tone: "positive",
            title: "Saved successfully",
            // message: 'Saved successfully',
          });
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to update item",
          tone: "negative",
          message: err.message,
        });
      });
  });
  const labelFieldValue = list.isSingleton
    ? list.label
    : state.item.data?.[list.labelField];
  const itemId = state.item.data?.id;
  const hasChangedFields = !!changedFields.size;
  usePreventNavigation(
    useMemo(() => ({ current: hasChangedFields }), [hasChangedFields])
  );
  return (
    <Fragment>
      <Box marginTop="xlarge">
        <GraphQLErrorNotice
          networkError={error?.networkError}
          // we're checking for path.length === 1 because errors with a path larger than 1 will be field level errors
          // which are handled seperately and do not indicate a failure to update the item
          errors={error?.graphQLErrors.filter((x) => x.path?.length === 1)}
        />
        <Fields
          groups={list.groups}
          fieldModes={fieldModes}
          fields={list.fields}
          forceValidation={forceValidation}
          invalidFields={invalidFields}
          position="form"
          fieldPositions={fieldPositions}
          onChange={useCallback(
            (value) => {
              setValue((state) => ({
                item: state.item,
                value: value(state.value),
              }));
            },
            [setValue]
          )}
          value={state.value}
        />
        <Toolbar
          onSave={onSave}
          hasChangedFields={!!changedFields.size}
          onReset={useEventCallback(() => {
            setValue((state) => ({
              item: state.item,
              value: deserializeValue(list.fields, state.item),
            }));
          })}
          loading={loading}
          deleteButton={useMemo(
            () =>
              showDelete ? (
                <DeleteButton
                  list={list}
                  itemLabel={labelFieldValue ?? itemId}
                  itemId={itemId}
                />
              ) : undefined,
            [showDelete, list, labelFieldValue, itemId]
          )}
        />
      </Box>
      <StickySidebar>
        <FieldLabel>Item ID</FieldLabel>
        <div
          css={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextInput
            css={{
              marginRight: spacing.medium,
              fontFamily: typography.fontFamily.monospace,
              fontSize: typography.fontSize.small,
            }}
            readOnly
            value={item.id}
          />
          <Tooltip content="Copy ID">
            {(props) => (
              <Button
                {...props}
                aria-label="Copy ID"
                onClick={() => {
                  copyToClipboard(item.id);
                }}
              >
                <ClipboardIcon size="small" />
              </Button>
            )}
          </Tooltip>
        </div>
        <Box marginTop="xlarge">
          <Fields
            groups={list.groups}
            fieldModes={fieldModes}
            fields={list.fields}
            forceValidation={forceValidation}
            invalidFields={invalidFields}
            position="sidebar"
            fieldPositions={fieldPositions}
            onChange={useCallback(
              (value) => {
                setValue((state) => ({
                  item: state.item,
                  value: value(state.value),
                }));
              },
              [setValue]
            )}
            value={state.value}
          />
        </Box>
      </StickySidebar>
    </Fragment>
  );
}

function DeleteButton({ itemLabel, itemId, list }) {
  const toasts = useToasts();
  const [deleteItem, { loading }] = useMutation(
    gql`mutation ($id: ID!) {
    ${list.gqlNames.deleteMutationName}(where: { id: $id }) {
      id
    }
  }`,
    { variables: { id: itemId } }
  );
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/dashboard";

  return (
    <Fragment>
      <Button
        tone="negative"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Delete
      </Button>
      <AlertDialog
        // TODO: change the copy in the title and body of the modal
        title="Delete Confirmation"
        isOpen={isOpen}
        tone="negative"
        actions={{
          confirm: {
            label: "Delete",
            action: async () => {
              try {
                await deleteItem();
              } catch (err) {
                return toasts.addToast({
                  title: `Failed to delete ${list.singular} item: ${itemLabel}`,
                  message: err.message,
                  tone: "negative",
                });
              }
              router.push(list.isSingleton ? `${adminPath}` : `${adminPath}/${list.path}`);
              return toasts.addToast({
                title: itemLabel,
                message: `Deleted ${list.singular} item successfully`,
                tone: "positive",
              });
            },
            loading,
          },
          cancel: {
            label: "Cancel",
            action: () => {
              setIsOpen(false);
            },
          },
        }}
      >
        Are you sure you want to delete <strong>{itemLabel}</strong>?
      </AlertDialog>
    </Fragment>
  );
}

export const ItemPage = ({ params }) => {
  const listKey = params.listKey;
  const id = params.id;
  const listsObject = {};
  for (const [key, list] of Object.entries(models)) {
    const { adminUILabels } = getNamesFromList(key, list);
    listsObject[adminUILabels.path] = key;
  }
  const key = listsObject[listKey];

  return <ItemPageTemplate listKey={key} id={id} />;
};

export const ItemPageTemplate = ({ listKey, id }) => {
  const list = useList(listKey);

  const { query, selectedFields } = useMemo(() => {
    const selectedFields = Object.entries(list.fields)
      .filter(
        ([fieldKey, field]) =>
          field.itemView.fieldMode !== "hidden" ||
          // the id field is hidden but we still need to fetch it
          fieldKey === "id"
      )
      .map(([fieldKey]) => {
        return list.fields[fieldKey].controller.graphqlSelection;
      })
      .join("\n");
    return {
      selectedFields,
      query: gql`
        query ItemPage($id: ID!, $listKey: String!) {
          item: ${list.gqlNames.itemQueryName}(where: {id: $id}) {
            ${selectedFields}
          }
          keystone {
            adminMeta {
              list(key: $listKey) {
                hideCreate
                hideDelete
                fields {
                  path
                  itemView(id: $id) {
                    fieldMode
                    fieldPosition
                  }
                }
              }
            }
          }
        }
      `,
    };
  }, [list]);
  let { data, error, loading } = useQuery(query, {
    variables: { id, listKey },
    errorPolicy: "all",
    skip: id === undefined,
  });
  loading ||= id === undefined;

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  const itemViewFieldModesByField = useMemo(() => {
    const itemViewFieldModesByField = {};
    dataGetter.data?.keystone?.adminMeta?.list?.fields?.forEach((field) => {
      if (
        field === null ||
        field.path === null ||
        field?.itemView?.fieldMode == null
      )
        return;
      itemViewFieldModesByField[field.path] = field.itemView.fieldMode;
    });
    return itemViewFieldModesByField;
  }, [dataGetter.data?.keystone?.adminMeta?.list?.fields]);

  const itemViewFieldPositionsByField = useMemo(() => {
    const itemViewFieldPositionsByField = {};
    dataGetter.data?.keystone?.adminMeta?.list?.fields?.forEach((field) => {
      if (
        field === null ||
        field.path === null ||
        field?.itemView?.fieldPosition == null
      )
        return;
      itemViewFieldPositionsByField[field.path] = field.itemView.fieldPosition;
    });
    return itemViewFieldPositionsByField;
  }, [dataGetter.data?.keystone?.adminMeta?.list?.fields]);

  const metaQueryErrors = dataGetter.get("keystone").errors;
  const pageTitle = list.isSingleton
    ? list.label
    : loading
    ? undefined
    : (data && data.item && (data.item[list.labelField] || data.item.id)) || id;

  return (
    <PageContainer
      title={pageTitle}
      header={
        <ItemPageHeader
          list={list}
          label={
            loading
              ? "Loading..."
              : (data &&
                  data.item &&
                  (data.item[list.labelField] || data.item.id)) ||
                id
          }
        />
      }
    >
      {loading ? (
        <Center css={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <LoadingDots label="Loading item data" size="large" tone="passive" />
        </Center>
      ) : metaQueryErrors ? (
        <Box marginY="xlarge">
          <Notice tone="negative">{metaQueryErrors[0].message}</Notice>
        </Box>
      ) : (
        <ColumnLayout>
          {data?.item == null ? (
            <Box marginY="xlarge">
              {error?.graphQLErrors.length || error?.networkError ? (
                <GraphQLErrorNotice
                  errors={error?.graphQLErrors}
                  networkError={error?.networkError}
                />
              ) : list.isSingleton ? (
                id === "1" ? (
                  <Stack gap="medium">
                    <Notice tone="negative">
                      {list.label} doesn't exist or you don't have access to it.
                    </Notice>
                    {!data.keystone.adminMeta.list.hideCreate && (
                      <CreateButtonLink list={list} />
                    )}
                  </Stack>
                ) : (
                  <Notice tone="negative">
                    The item with id "{id}" does not exist
                  </Notice>
                )
              ) : (
                <Notice tone="negative">
                  The item with id "{id}" could not be found or you don't have
                  access to it.
                </Notice>
              )}
            </Box>
          ) : (
            <Fragment>
              <ItemForm
                fieldModes={itemViewFieldModesByField}
                fieldPositions={itemViewFieldPositionsByField}
                selectedFields={selectedFields}
                showDelete={!data.keystone.adminMeta.list.hideDelete}
                listKey={listKey}
                itemGetter={dataGetter.get("item")}
                item={data.item}
              />
            </Fragment>
          )}
        </ColumnLayout>
      )}
    </PageContainer>
  );
};

// Styled Components
// ------------------------------

const Toolbar = memo(function Toolbar({
  hasChangedFields,
  loading,
  onSave,
  onReset,
  deleteButton,
}) {
  return (
    <BaseToolbar>
      <Button
        isDisabled={!hasChangedFields}
        isLoading={loading}
        weight="bold"
        tone="active"
        onClick={onSave}
      >
        Save changes
      </Button>
      <Stack align="center" across gap="small">
        {hasChangedFields ? (
          <ResetChangesButton onReset={onReset} />
        ) : (
          <Text weight="medium" paddingX="large" color="neutral600">
            No changes
          </Text>
        )}
        {deleteButton}
      </Stack>
    </BaseToolbar>
  );
});

function ResetChangesButton(props) {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  return (
    <Fragment>
      <Button
        weight="none"
        onClick={() => {
          setConfirmModalOpen(true);
        }}
      >
        Reset changes
      </Button>
      <AlertDialog
        actions={{
          confirm: {
            action: () => props.onReset(),
            label: "Reset changes",
          },
          cancel: {
            action: () => setConfirmModalOpen(false),
            label: "Cancel",
          },
        }}
        isOpen={isConfirmModalOpen}
        title="Are you sure you want to reset changes?"
        tone="negative"
      >
        {null}
      </AlertDialog>
    </Fragment>
  );
}

const StickySidebar = (props) => {
  const { spacing } = useTheme();
  return (
    <div
      css={{
        marginTop: spacing.xlarge,
        marginBottom: spacing.xxlarge,
        position: "sticky",
        top: spacing.xlarge,
      }}
      {...props}
    />
  );
};
