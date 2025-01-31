import { useState } from "react";
import isDeepEqual from "fast-deep-equal";
import { useFieldsObj } from "@keystone/utils/useFieldObj";

import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import {
  makeDataGetter,
  useInvalidFields,
  serializeValueToObjByFieldKey,
} from "@keystone-6/core/admin-ui/utils";
import { Button } from "../../primitives/default/ui/button";
import { GraphQLErrorNotice } from "../GraphQLErrorNotice";
import { useToasts } from "../Toast";
import { Fields } from "../Fields";

export function InlineCreate({
  list,
  onCancel,
  onCreate,
  fields: fieldPaths,
  selectedFields,
}) {
  const toasts = useToasts();
  const fields = useFieldsObj(list, fieldPaths);

  const [createItem, { loading, error }] =
    useMutation(gql`mutation($data: ${list.gqlNames.createInputName}!) {
    item: ${list.gqlNames.createMutationName}(data: $data) {
      ${selectedFields}
  }
}`);

  const [value, setValue] = useState(() => {
    const value = {};
    Object.keys(fields).forEach((fieldPath) => {
      value[fieldPath] = {
        kind: "value",
        value: fields[fieldPath].controller.defaultValue,
      };
    });
    return value;
  });

  const invalidFields = useInvalidFields(fields, value);

  const [forceValidation, setForceValidation] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);

    if (newForceValidation) return;
    const data = {};
    const allSerializedValues = serializeValueToObjByFieldKey(fields, value);
    Object.keys(allSerializedValues).forEach((fieldPath) => {
      const { controller } = fields[fieldPath];
      const serialized = allSerializedValues[fieldPath];
      if (
        !isDeepEqual(serialized, controller.serialize(controller.defaultValue))
      ) {
        Object.assign(data, serialized);
      }
    });

    createItem({
      variables: {
        data,
      },
    })
      .then(({ data, errors }) => {
        // we're checking for path.length === 1 because errors with a path larger than 1 will be field level errors
        // which are handled seperately and do not indicate a failure to update the item
        const error = errors?.find((x) => x.path?.length === 1);
        if (error) {
          toasts.addToast({
            title: "Failed to create item",
            tone: "negative",
            message: error.message,
          });
        } else {
          toasts.addToast({
            title: data.item[list.labelField] || data.item.id,
            tone: "positive",
            message: "Saved successfully",
          });
          onCreate(makeDataGetter(data, errors).get("item"));
        }
      })
      .catch((err) => {
        toasts.addToast({
          title: "Failed to update item",
          tone: "negative",
          message: err.message,
        });
      });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        {error && (
          <GraphQLErrorNotice
            networkError={error?.networkError}
            errors={error?.graphQLErrors}
          />
        )}
        <Fields
          fields={fields}
          forceValidation={forceValidation}
          invalidFields={invalidFields}
          onChange={setValue}
          value={value}
        />
        <div className="flex gap-1 flex-wrap">
          <Button isLoading={loading} size="sm" type="submit">
            Create {list.singular}
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
