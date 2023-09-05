/** @jsxRuntime classic */
/** @jsx jsx */

import { Button } from "@keystone-ui/button"
import {
  jsx,
  makeId,
  useId,
  useTheme,
  Heading,
  Stack,
  Divider
} from "@keystone-ui/core"

import { DrawerBase } from "./DrawerBase"
import { useDrawerControllerContext } from "./DrawerController"

export const Drawer = ({
  actions,
  children,
  title,
  id,
  initialFocusRef,
  width = "narrow"
}) => {
  const transitionState = useDrawerControllerContext()
  const { cancel, confirm } = actions
  const { colors, spacing } = useTheme()

  const safeClose = actions.confirm.loading ? () => {} : actions.cancel.action

  const instanceId = useId(id)
  const headingId = makeId(instanceId, "heading")

  return (
    <DrawerBase
      transitionState={transitionState}
      aria-labelledby={headingId}
      initialFocusRef={initialFocusRef}
      onSubmit={actions.confirm.action}
      onClose={safeClose}
      width={width}
    >
      <div
        css={{
          alignItems: "center",
          borderBottom: `1px solid ${colors.border}`,
          boxSizing: "border-box",
          display: "flex",
          flexShrink: 0,
          height: 80,
          padding: `${spacing.large}px ${spacing.xlarge}px`
        }}
      >
        <Heading id={headingId} type="h3">
          {title}
        </Heading>
      </div>

      <div css={{ overflowY: "auto", padding: `0 ${spacing.xlarge}px` }}>
        {children}
      </div>

      <Divider marginX="xlarge" />
      <Stack padding="xlarge" across gap="small">
        <Button
          tone="active"
          weight="bold"
          type="submit"
          isLoading={confirm.loading}
        >
          {confirm.label}
        </Button>
        <Button
          onClick={safeClose}
          disabled={confirm.loading}
          weight="none"
          tone="passive"
        >
          {cancel.label}
        </Button>
      </Stack>
    </DrawerBase>
  )
}
