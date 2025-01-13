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
import { AlertTriangle } from "lucide-react";
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

export function ColumnLayout(props) {
  return (
    // this container must be relative to catch absolute children
    // particularly the "expanded" document-field, which needs a height of 100%
    <div
      className="items-start grid"
      style={{ gridTemplateColumns: "3fr 0fr" }}
      {...props}
    />
  );
}

export function BaseToolbar(props) {
  return (
    // <div className="border-t-2 bottom-0 flex justify-between mt-10 pb-2 pt-2 sticky z-20 bg-background text-foreground">
    <div className="shadow-sm bottom-3 border flex justify-between p-2 rounded-lg sticky z-20 mt-5 bg-zinc-200 dark:bg-zinc-950">
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
    <div className="flex">
      <div className="flex-1">
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
      </div>
      <StickySidebar>
        <div className="ml-4 w-72 flex flex-col gap-1.5">
          <FieldLabel>Item ID</FieldLabel>
          <code className="py-[9px] border flex px-4 items-center relative rounded-md shadow-sm bg-muted/40 font-mono text-sm font-medium">
            {item.id}
          </code>
        </div>
        <div>
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
        </div>
      </StickySidebar>
    </div>
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
  const router = useRouter();

  const adminPath = basePath;

  return (
    <Fragment>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
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
              <Button variant="light">Close</Button>
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
                  list.isSingleton
                    ? `${adminPath}`
                    : `${adminPath}/${list.path}`
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

  console.log(list.fields);

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
    console.log({ selectedFields });
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
    <div>
      <div>
        {/* <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <AdminLink href="/">Dashboard</AdminLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                {list.isSingleton ? (
                  <div className="ml-1 text-md font-medium text-zinc-700 hover:text-blue-600 md:ml-2 dark:text-zinc-400 dark:hover:text-white">
                    {list.label}
                  </div>
                ) : (
                  <AdminLink href={`/${list.path}`}>{list.label}</AdminLink>
                )}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <ItemLabel skeletonClass={"h-5 w-[100px]"} />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}
        <div className="flex items-center justify-between">
          <div className="flex-col items-center mt-2 mb-4">
            <h1 className="flex text-lg font-semibold md:text-2xl">
              Manage <ItemLabel skeletonClass={"ml-3 h-7 w-[150px]"} />
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
        </div>
      </div>
      {loading ? (
        // <LoadingIcon label="Loading item data" />
        null
      ) : metaQueryErrors ? (
        <div>
          <Alert variant="destructive">{metaQueryErrors[0].message}</Alert>
        </div>
      ) : (
        <ColumnLayout>
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
    </div>
  );

  function ItemLabel({ skeletonClass }) {
    return loading ? (
      <Skeleton className={skeletonClass} />
    ) : (
      (data && data.item && (data.item[list.labelField] || data.item.id)) || id
    );
  }
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
      {deleteButton}

      <div className="flex items-center gap-2">
        {hasChangedFields ? (
          <ResetChangesButton onReset={onReset} />
        ) : (
          <text className="font-medium px-5 text-sm">No changes</text>
        )}
        <Button
          disabled={!hasChangedFields}
          isLoading={loading}
          onClick={onSave}
        >
          Save changes
        </Button>
      </div>
    </BaseToolbar>
  );
});

function ResetChangesButton(props) {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  return (
    <Fragment>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Reset changes</Button>
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
              <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => props.onReset()}>
              Reset Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

const StickySidebar = (props) => {
  return (
    <div className="hidden lg:block mb-20 sticky top-8" {...props} />
  );
};
