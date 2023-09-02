/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@keystone-ui/core";

import { Fragment, useMemo, useState } from "react";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";

import { Button } from "@keystone-ui/button";

import { useToasts } from "@keystone/components/Toast";
import { AlertDialog } from "@keystone/components/Modals";

export function DeleteManyButton({ selectedItems, list, refetch }) {
  const [deleteItems, deleteItemsState] = useMutation(
    useMemo(
      () => gql`
    mutation($where: [${list.gqlNames.whereUniqueInputName}!]!) {
      ${list.gqlNames.deleteManyMutationName}(where: $where) {
        id
        ${list.labelField}
      }
    }
`,
      [list]
    ),
    { errorPolicy: "all" }
  );
  const [isOpen, setIsOpen] = useState(false);
  const toasts = useToasts();
  return (
    <Fragment>
      <Button
        isLoading={deleteItemsState.loading}
        tone="negative"
        onClick={async () => {
          setIsOpen(true);
        }}
      >
        Delete
      </Button>
      <AlertDialog
        // TODO: change the copy in the title and body of the modal
        isOpen={isOpen}
        title="Delete Confirmation"
        tone="negative"
        actions={{
          confirm: {
            label: "Delete",
            action: async () => {
              const { data, errors } = await deleteItems({
                variables: { where: [...selectedItems].map((id) => ({ id })) },
              });
              /*
                Data returns an array where successful deletions are item objects
                and unsuccessful deletions are null values.
                Run a reduce to count success and failure as well as
                to generate the success message to be passed to the success toast
               */
              const { successfulItems, unsuccessfulItems, successMessage } =
                data[list.gqlNames.deleteManyMutationName].reduce(
                  (acc, curr) => {
                    if (curr) {
                      acc.successfulItems++;
                      acc.successMessage =
                        acc.successMessage === ""
                          ? (acc.successMessage += curr[list.labelField])
                          : (acc.successMessage += `, ${
                              curr[list.labelField]
                            }`);
                    } else {
                      acc.unsuccessfulItems++;
                    }
                    return acc;
                  },
                  {
                    successfulItems: 0,
                    unsuccessfulItems: 0,
                    successMessage: "",
                  }
                );

              // If there are errors
              if (errors?.length) {
                // Find out how many items failed to delete.
                // Reduce error messages down to unique instances, and append to the toast as a message.
                toasts.addToast({
                  tone: "negative",
                  title: `Failed to delete ${unsuccessfulItems} of ${
                    data[list.gqlNames.deleteManyMutationName].length
                  } ${list.plural}`,
                  message: errors
                    .reduce((acc, error) => {
                      if (acc.indexOf(error.message) < 0) {
                        acc.push(error.message);
                      }
                      return acc;
                    }, [])
                    .join("\n"),
                });
              }

              if (successfulItems) {
                toasts.addToast({
                  tone: "positive",
                  title: `Deleted ${successfulItems} of ${
                    data[list.gqlNames.deleteManyMutationName].length
                  } ${list.plural} successfully`,
                  message: successMessage,
                });
              }

              return refetch();
            },
          },
          cancel: {
            label: "Cancel",
            action: () => {
              setIsOpen(false);
            },
          },
        }}
      >
        Are you sure you want to delete {selectedItems.size}{" "}
        {selectedItems.size === 1 ? list.singular : list.plural}?
      </AlertDialog>
    </Fragment>
  );
}
