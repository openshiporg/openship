import { forwardRef } from "react"

export const forwardRefWithAs = render => {
  // @ts-ignore
  return forwardRef(render)
}
