/** @jsxRuntime classic */
/** @jsx jsx */
import { useTheme } from "@keystone-ui/core"
import { Trash2Icon } from "@keystone-ui/icons/icons/Trash2Icon"
import { useControlledPopover } from "@keystone-ui/popover"
import { Tooltip } from "@keystone-ui/tooltip"
import { InlineDialog, ToolbarButton } from "../primitives"

export function ChromelessComponentBlockElement(props) {
  const { trigger, dialog } = useControlledPopover(
    { isOpen: props.isOpen, onClose: () => {} },
    { modifiers: [{ name: "offset", options: { offset: [0, 8] } }] }
  )
  const { spacing } = useTheme()
  const ChromelessToolbar =
    props.componentBlock.toolbar ?? DefaultToolbarWithoutChrome
  return (
    <div
      {...props.attributes}
      css={{
        marginBottom: spacing.xlarge,
        marginTop: spacing.xlarge
      }}
    >
      <div {...trigger.props} ref={trigger.ref}>
        {props.renderedBlock}
        {props.isOpen && (
          <InlineDialog {...dialog.props} ref={dialog.ref}>
            <ChromelessToolbar
              onRemove={props.onRemove}
              props={props.previewProps}
            />
          </InlineDialog>
        )}
      </div>
    </div>
  )
}

function DefaultToolbarWithoutChrome({ onRemove }) {
  return (
    <Tooltip content="Remove" weight="subtle">
      {attrs => (
        <ToolbarButton
          variant="destructive"
          onMouseDown={event => {
            event.preventDefault()
            onRemove()
          }}
          {...attrs}
        >
          <Trash2Icon size="small" />
        </ToolbarButton>
      )}
    </Tooltip>
  )
}
