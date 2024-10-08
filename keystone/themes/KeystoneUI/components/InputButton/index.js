/** @jsxRuntime classic */
/** @jsx jsx */

import { forwardRef } from "react"
import { jsx, useTheme, VisuallyHidden } from "@keystone-ui/core"
import { XIcon } from "@keystone-ui/icons/icons/XIcon"
import { CalendarIcon } from "@keystone-ui/icons/icons/CalendarIcon"
import { Adornment, AdornmentWrapper } from "../Adornment"
import { useInputTokens, useInputStyles } from "../Fields/hooks/useInputTokens"

export const InputButton = forwardRef(
  ({ invalid = false, isSelected, onClear, ...props }, ref) => {
    const { spacing } = useTheme()
    const inputTokens = useInputTokens({ size: "medium" })
    const inputStyles = useInputStyles({ invalid, tokens: inputTokens })
    const focusStyles = isSelected
      ? {
          ...inputStyles[":focus"],
          ":hover": inputStyles[":focus"],
          ":focus": inputStyles[":focus"]
        }
      : null
    const buttonStyles = {
      ...inputStyles,
      ...focusStyles,
      cursor: "pointer",

      // let the button vertically align its text; the have different native behaviour to inputs
      lineHeight: "initial",

      textAlign: "left"
    }

    return (
      <AdornmentWrapper shape="square" size="medium">
        <button
          aria-invalid={invalid}
          ref={ref}
          css={buttonStyles}
          type="button"
          {...props}
        />
        {onClear && <ClearButton onClick={onClear} />}
        <Adornment
          align="right"
          css={{ paddingRight: spacing.small, pointerEvents: "none" }}
        >
          <CalendarIcon color="dim" />
        </Adornment>
      </AdornmentWrapper>
    )
  }
)

const ClearButton = props => {
  const { colors } = useTheme()

  return (
    <Adornment
      as="button"
      align="right"
      type="button"
      tabIndex={-1}
      css={{
        alignItems: "center",
        background: 0,
        border: 0,
        borderRadius: "50%",
        color: colors.foregroundDim,
        display: "flex",
        justifyContent: "center",
        outline: 0,
        padding: 0,
        right: "6px", // TODO ? sizes.medium.boxSize,
        top: "6px", // TODO - magic number

        // No focus styles because this button is not focusable
        ":focus": {
          color: "hotpink"
        },
        ":hover": {
          color: colors.foregroundMuted
        }
      }}
      {...props}
    >
      <VisuallyHidden as="span">clear date value</VisuallyHidden>
      <XIcon size="small" />
    </Adornment>
  )
}
