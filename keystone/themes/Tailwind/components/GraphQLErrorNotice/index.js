import { Stack } from "@keystone-ui/core"
import { Notice } from "@keystone-ui/notice"
import React from "react"

export function GraphQLErrorNotice({ errors, networkError }) {
  if (networkError) {
    return (
      <Notice tone="negative" marginBottom="large">
        {networkError.message}
      </Notice>
    )
  }
  if (errors?.length) {
    return (
      <Stack gap="small" marginBottom="large">
        {errors.map((err, idx) => (
          <Notice tone="negative" key={idx}>
            {err.message}
          </Notice>
        ))}
      </Stack>
    )
  }
  return null
}
