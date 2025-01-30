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
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { useList } from "@keystone/keystoneProvider";
import { usePreventNavigation } from "@keystone/utils/usePreventNavigation";
import { gql, useMutation, useQuery } from "@keystone-6/core/admin-ui/apollo";
import {
  deserializeValue,
  makeDataGetter,
  useChangedFieldsAndDataForUpdate,
  useInvalidFields,
} from "@keystone-6/core/admin-ui/utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../primitives/default/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../primitives/default/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../primitives/default/ui/breadcrumb";
import { CreateButtonLink } from "../../components/CreateButtonLink";
import { FieldLabel } from "../../components/FieldLabel";
import { Fields } from "../../components/Fields";
import { GraphQLErrorNotice } from "../../components/GraphQLErrorNotice";
import { useToasts } from "../../components/Toast";
import { AdminLink } from "../../components/AdminLink";
import { Button } from "../../primitives/default/ui/button";
import { LoadingIcon } from "../../components/LoadingIcon";
import { Skeleton } from "../../primitives/default/ui/skeleton";
import { basePath } from "@keystone/index";
import { PageBreadcrumbs } from "../../components/PageBreadcrumbs";

export function ItemPageHeader(props) {
  return (
    <div className="flex">
      <nav className="pb-2 rounded-lg" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <AdminLink
              href="/"
              className="inline-flex items-center text-md font-medium text-zinc-700 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-white"
            >
              <svg
                className="w-3 h-3 mr-2.5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
              </svg>
              Home
            </AdminLink>
          </li>

          {props.list.isSingleton ? (
            <h3>{props.list.label}</h3>
          ) : (
            <Fragment>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 mx-1 text-zinc-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <AdminLink
                    href={`/${props.list.path}`}
                    className="ml-1 text-md font-medium text-zinc-700 hover:text-blue-600 md:ml-2 dark:text-zinc-400 dark:hover:text-white"
                  >
                    {props.list.label}
                  </AdminLink>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 mx-1 text-zinc-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <div className="ml-1 text-md font-medium text-zinc-700 hover:text-blue-600 md:ml-2 dark:text-zinc-400 dark:hover:text-white">
                    {props.label}
                  </div>
                </div>
              </li>
            </Fragment>
          )}
        </ol>
      </nav>
    </div>
  );
}

// Core layout components
const ColumnLayout = (props) => (
  <div
    className="items-start grid"
    style={{ gridTemplateColumns: "3fr 0fr" }}
    {...props}
  />
);

const StickySidebar = (props) => (
  <div className="hidden lg:block mb-20 sticky top-8" {...props} />
);

const BaseToolbar = (props) => (
  <div className="-mb-4 md:-mb-6 shadow-sm bottom-0 border border-b-0 flex flex-wrap justify-between p-2 rounded-t-xl sticky z-20 mt-5 bg-background gap-2">
    {props.children}
  </div>
);

// Utility hook
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

// UI Components
const ItemFormFields = memo(function ItemFormFields({
  list,
  fields,
  fieldModes,
  fieldPositions,
  forceValidation,
  invalidFields,
  value,
  onChange,
  position,
}) {
  return (
    <Fields
      groups={list.groups}
      fieldModes={fieldModes}
      fields={fields}
      forceValidation={forceValidation}
      invalidFields={invalidFields}
      position={position}
      fieldPositions={fieldPositions}
      onChange={onChange}
      value={value}
    />
  );
});

const ItemFormContent = memo(function ItemFormContent({
  list,
  item,
  error,
  fieldModes,
  fieldPositions,
  forceValidation,
  invalidFields,
  value,
  onChange,
}) {
  return (
    <ColumnLayout>
      <div className="flex-1">
        <GraphQLErrorNotice
          networkError={error?.networkError}
          errors={error?.graphQLErrors?.filter((x) => x.path?.length === 1)}
        />
        <ItemFormFields
          list={list}
          fields={list.fields}
          fieldModes={fieldModes}
          fieldPositions={fieldPositions}
          forceValidation={forceValidation}
          invalidFields={invalidFields}
          value={value}
          onChange={onChange}
          position="form"
        />
      </div>
      <StickySidebar>
        <div className="ml-4 w-72 flex flex-col gap-1.5">
          <FieldLabel>Item ID</FieldLabel>
          <code className="py-[9px] border flex px-4 items-center relative rounded-md shadow-sm bg-muted/40 font-mono text-sm font-medium">
            {item.id}
          </code>
        </div>
        <div>
          <ItemFormFields
            list={list}
            fields={list.fields}
            fieldModes={fieldModes}
            fieldPositions={fieldPositions}
            forceValidation={forceValidation}
            invalidFields={invalidFields}
            value={value}
            onChange={onChange}
            position="sidebar"
          />
        </div>
      </StickySidebar>
    </ColumnLayout>
  );
});

// Logic Components
function useItemState(list, itemGetter) {
  const [state, setValue] = useState(() => ({
    value: deserializeValue(list.fields, itemGetter),
    item: itemGetter,
  }));

  if (
    itemGetter &&
    state.item.data !== itemGetter.data &&
    (itemGetter.errors || []).every((x) => x.path?.length !== 1)
  ) {
    const value = deserializeValue(list.fields, itemGetter);
    setValue({ value, item: itemGetter });
  }

  return [state, setValue];
}

function useItemForm({ list, selectedFields, itemGetter }) {
  const toasts = useToasts();
  const [state, setValue] = useItemState(list, itemGetter);

  const [update, { loading, error, data }] = useMutation(
    gql`mutation ($data: ${list.gqlNames.updateInputName}!, $id: ID!) {
      item: ${list.gqlNames.updateMutationName}(where: { id: $id }, data: $data) {
        ${selectedFields}
      }
    }`,
    { errorPolicy: "all" }
  );

  const { changedFields, dataForUpdate } = useChangedFieldsAndDataForUpdate(
    list.fields,
    state.item,
    state.value
  );

  const invalidFields = useInvalidFields(list.fields, state.value);
  const [forceValidation, setForceValidation] = useState(false);

  const onSave = useEventCallback(() => {
    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);
    if (newForceValidation) return;

    update({
      variables: { data: dataForUpdate, id: state.item.get("id").data },
    })
      .then(({ errors }) => {
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
            tone: "positive",
            title: "Saved successfully",
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

  const onReset = useEventCallback(() => {
    setValue((state) => ({
      item: state.item,
      value: deserializeValue(list.fields, state.item),
    }));
  });

  usePreventNavigation(
    useMemo(() => ({ current: !!changedFields.size }), [changedFields.size])
  );

  return {
    state,
    setValue,
    loading,
    error,
    forceValidation,
    invalidFields,
    changedFields,
    onSave,
    onReset,
  };
}

// Main Components
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
  const router = useRouter();
  const adminPath = basePath;

  return (
    <Fragment>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="rounded-t-[calc(theme(borderRadius.lg)-1px)]">
            <Trash2 className="md:mr-2" />
            <span className="hidden md:inline">Delete</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <text className="text-sm">
            Are you sure you want to delete <strong>{itemLabel}</strong>?
          </text>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button
              variant="destructive"
              isLoading={loading}
              onClick={async () => {
                try {
                  await deleteItem();
                } catch (err) {
                  return toasts.addToast({
                    title: `Failed to delete ${list.singular} item: ${itemLabel}`,
                    message: err.message,
                    tone: "negative",
                  });
                }
                router.push(
                  list.isSingleton ? `${adminPath}` : `${adminPath}/${list.path}`
                );
                return toasts.addToast({
                  title: itemLabel,
                  message: `Deleted ${list.singular} item successfully`,
                  tone: "positive",
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

function ItemForm({
  list,
  itemGetter,
  selectedFields,
  fieldModes,
  fieldPositions,
  item,
  showDelete,
}) {
  const {
    state,
    setValue,
    loading,
    error,
    forceValidation,
    invalidFields,
    changedFields,
    onSave,
    onReset,
  } = useItemForm({
    list,
    selectedFields,
    itemGetter,
  });

  const labelFieldValue = list.isSingleton
    ? list.label
    : state.item.data?.[list.labelField];
  const itemId = state.item.data?.id;

  return (
    <Fragment>
      <ItemFormContent
        list={list}
        item={item}
        error={error}
        fieldModes={fieldModes}
        fieldPositions={fieldPositions}
        forceValidation={forceValidation}
        invalidFields={invalidFields}
        value={state.value}
        onChange={useCallback(
          (value) => {
            setValue((state) => ({
              item: state.item,
              value: value(state.value),
            }));
          },
          [setValue]
        )}
      />
      <Toolbar
        hasChangedFields={!!changedFields.size}
        loading={loading}
        onSave={onSave}
        onReset={onReset}
        deleteButton={
          showDelete ? (
            <DeleteButton
              list={list}
              itemLabel={labelFieldValue ?? itemId}
              itemId={itemId}
            />
          ) : undefined
        }
      />
    </Fragment>
  );
}

const Toolbar = memo(function Toolbar({
  hasChangedFields,
  loading,
  onSave,
  onReset,
  deleteButton,
}) {
  return (
    <BaseToolbar>
      <div className="flex items-center gap-2 flex-wrap">
        {deleteButton}
        {hasChangedFields ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-t-[calc(theme(borderRadius.lg)-1px)]">
                <span className="md:hidden"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></span>
                <span className="hidden md:inline">Reset changes</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reset Confirmation</DialogTitle>
              </DialogHeader>
              <text className="text-sm">
                Are you sure you want to reset changes?
              </text>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button variant="destructive" onClick={onReset}>
                  Reset Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <text className="font-medium px-5 text-sm hidden md:block">No changes</text>
        )}
        <Button
          disabled={!hasChangedFields}
          isLoading={loading}
          onClick={onSave}
          className="rounded-t-[calc(theme(borderRadius.lg)-1px)]"
        >
          <Save className="md:mr-2" />
          <span className="hidden md:inline">Save changes</span>
        </Button>
      </div>
    </BaseToolbar>
  );
});

// Page Components
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

  return (
    <>
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "model",
            label: list.label,
            href: `/${list.path}`,
            showModelSwitcher: true,
          },
          {
            type: "page",
            label: loading
              ? "Loading..."
              : data?.item?.[list.labelField] || data?.item?.id || id,
          },
        ]}
      />
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
        <div className="flex-col items-center">
          <h1 className="flex text-lg font-semibold md:text-2xl">
            Manage{" "}
            {loading ? (
              <Skeleton className="ml-3 h-7 w-[150px]" />
            ) : (
              (data?.item?.[list.labelField] || data?.item?.id || id)
            )}
          </h1>
          <p className="text-muted-foreground">
            {list.description ? (
              <p>{list.description}</p>
            ) : (
              <span>
                Update or delete this{" "}
                <span className="lowercase">{list.singular}</span>
              </span>
            )}
          </p>
        </div>
        {loading ? null : metaQueryErrors ? (
          <div>
            <Alert variant="destructive">{metaQueryErrors[0].message}</Alert>
          </div>
        ) : (
          <div>
            {data?.item == null ? (
              <div>
                {error?.graphQLErrors.length || error?.networkError ? (
                  <GraphQLErrorNotice
                    errors={error?.graphQLErrors}
                    networkError={error?.networkError}
                  />
                ) : list.isSingleton ? (
                  id === "1" ? (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertTitle>System Error</AlertTitle>
                        <AlertDescription>
                          {list.label} doesn't exist or you don't have access to
                          it.
                        </AlertDescription>
                      </Alert>
                      {!data.keystone.adminMeta.list.hideCreate && (
                        <CreateButtonLink list={list} />
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>System Error</AlertTitle>
                      <AlertDescription>
                        The item with id "{id}" does not exist
                      </AlertDescription>
                    </Alert>
                  )
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4 stroke-red-900 dark:stroke-red-500" />
                    <AlertTitle>System Error</AlertTitle>
                    <AlertDescription>
                      The item with id "{id}" could not be found or you don't have
                      access to it.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <ItemForm
                list={list}
                fieldModes={itemViewFieldModesByField}
                fieldPositions={itemViewFieldPositionsByField}
                selectedFields={selectedFields}
                itemGetter={dataGetter.get("item")}
                item={data.item}
                showDelete={!data.keystone.adminMeta.list.hideDelete}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
};
