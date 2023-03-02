import { useCallback, useMemo, useState } from "react"
import isDeepEqual from "fast-deep-equal"
import { Box } from "@keystone-ui/core"
import { Drawer } from "@keystone-ui/modals"
import { useToasts } from "@keystone-ui/toast"
import { LoadingDots } from "@keystone-ui/loading"

import { gql, useMutation } from "../apollo"
import { useKeystone, useList } from "../context"

import { Fields } from "../utils/Fields"
import { usePreventNavigation } from "../utils/usePreventNavigation"
import { GraphQLErrorNotice } from "./GraphQLErrorNotice"

export function CreateItemDrawer({ listKey, onClose, onCreate }) {
  const { createViewFieldModes } = useKeystone()
  const list = useList(listKey)

  const toasts = useToasts()

  const [
    createItem,
    { loading, error, data: returnedData }
  ] = useMutation(gql`mutation($data: ${list.gqlNames.createInputName}!) {
    item: ${list.gqlNames.createMutationName}(data: $data) {
      id
      label: ${list.labelField}
  }
}`)

  const [value, setValue] = useState(() => {
    const value = {}
    Object.keys(list.fields).forEach(fieldPath => {
      value[fieldPath] = {
        kind: "value",
        value: list.fields[fieldPath].controller.defaultValue
      }
    })
    return value
  })

  const invalidFields = useMemo(() => {
    const invalidFields = new Set()

    Object.keys(value).forEach(fieldPath => {
      const val = value[fieldPath].value

      const validateFn = list.fields[fieldPath].controller.validate
      if (validateFn) {
        const result = validateFn(val)
        if (result === false) {
          invalidFields.add(fieldPath)
        }
      }
    })
    return invalidFields
  }, [list, value])

  const [forceValidation, setForceValidation] = useState(false)

  const data = {}
  Object.keys(list.fields).forEach(fieldPath => {
    const { controller } = list.fields[fieldPath]
    const serialized = controller.serialize(value[fieldPath].value)
    if (
      !isDeepEqual(serialized, controller.serialize(controller.defaultValue))
    ) {
      Object.assign(data, serialized)
    }
  })

  const shouldPreventNavigation =
    !returnedData?.item && Object.keys(data).length !== 0

  usePreventNavigation(shouldPreventNavigation)

  return (
    <Drawer
      title={`Create ${list.singular}`}
      width="wide"
      actions={{
        confirm: {
          label: `Create ${list.singular}`,
          loading,
          action: () => {
            const newForceValidation = invalidFields.size !== 0
            setForceValidation(newForceValidation)

            if (newForceValidation) return

            createItem({
              variables: {
                data
              }
            })
              .then(({ data }) => {
                const label = data.item.label || data.item.id
                onCreate({ id: data.item.id, label })
                toasts.addToast({
                  title: label,
                  message: "Created Successfully",
                  tone: "positive"
                })
              })
              .catch(() => {})
          }
        },
        cancel: {
          label: "Cancel",
          action: () => {
            if (
              !shouldPreventNavigation ||
              window.confirm(
                "There are unsaved changes, are you sure you want to exit?"
              )
            ) {
              onClose()
            }
          }
        }
      }}
    >
      {createViewFieldModes.state === "error" && (
        <GraphQLErrorNotice
          networkError={
            createViewFieldModes.error instanceof Error
              ? createViewFieldModes.error
              : undefined
          }
          errors={
            createViewFieldModes.error instanceof Error
              ? undefined
              : createViewFieldModes.error
          }
        />
      )}
      {createViewFieldModes.state === "loading" && (
        <LoadingDots label="Loading create form" />
      )}
      {error && (
        <GraphQLErrorNotice
          networkError={error?.networkError}
          errors={error?.graphQLErrors}
        />
      )}
      <Box paddingY="xlarge">
        <Fields
          fields={list.fields}
          fieldModes={
            createViewFieldModes.state === "loaded"
              ? createViewFieldModes.lists[list.key]
              : null
          }
          forceValidation={forceValidation}
          invalidFields={invalidFields}
          value={value}
          onChange={useCallback(getNewValue => {
            setValue(oldValues => getNewValue(oldValues))
          }, [])}
        />
      </Box>
    </Drawer>
  )
}