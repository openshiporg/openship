import { useTheme } from "@keystone-ui/core"

export const useIndicatorTokens = ({ size: sizeKey, type }) => {
  const { controlSizes, fields } = useTheme()

  const size = controlSizes[sizeKey]

  return {
    background: fields.controlBackground,
    borderColor: fields.controlBorderColor,
    borderRadius: type === "checkbox" ? fields.controlBorderRadius : "50%",
    borderWidth: fields.controlBorderWidth,
    boxSize: size.indicatorBoxSize,
    foreground: fields.controlBackground, // visually hide the icon unless the control is checked
    hover: {
      background: fields.hover.controlBackground,
      borderColor: fields.hover.controlBorderColor,
      shadow: fields.hover.shadow,
      foreground: fields.hover.controlForeground
    },
    focus: {
      background: fields.focus.controlBackground,
      borderColor: fields.focus.controlBorderColor,
      shadow: fields.focus.shadow,
      foreground: fields.focus.controlForeground
    },
    selected: {
      background:
        type === "checkbox"
          ? fields.selected.controlBackground
          : fields.selected.controlForeground,
      borderColor: fields.selected.controlBorderColor,
      shadow: fields.selected.shadow,
      foreground:
        type === "checkbox"
          ? fields.selected.controlForeground
          : fields.selected.controlBackground
    },
    disabled: {
      background: fields.disabled.controlBackground,
      borderColor: fields.disabled.controlBorderColor,
      shadow: fields.disabled.shadow,
      foreground: fields.disabled.controlForeground
    }
  }
}

export const useIndicatorStyles = ({ tokens }) => {
  return {
    alignItems: "center",
    backgroundColor: tokens.background,
    borderColor: tokens.borderColor,
    borderRadius: tokens.borderRadius,
    borderStyle: "solid",
    borderWidth: tokens.borderWidth,
    boxSizing: "border-box",
    color: tokens.foreground,
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    height: tokens.boxSize,
    justifyContent: "center",
    transition: tokens.transition,
    width: tokens.boxSize,

    "input:hover + &": {
      backgroundColor: tokens.hover.background,
      borderColor: tokens.hover.borderColor,
      boxShadow: tokens.hover.shadow,
      color: tokens.hover.foreground
    },

    "input:focus + &": {
      backgroundColor: tokens.focus.background,
      borderColor: tokens.focus.borderColor,
      boxShadow: tokens.focus.shadow,
      color: tokens.focus.foreground
    },

    "input:checked + &": {
      backgroundColor: tokens.selected.background,
      borderColor: tokens.selected.borderColor,
      boxShadow: tokens.selected.shadow,
      color: tokens.selected.foreground
    },

    "input:disabled + &": {
      backgroundColor: tokens.disabled.background,
      borderColor: tokens.disabled.borderColor,
      boxShadow: tokens.disabled.shadow,
      color: tokens.disabled.background,
      cursor: "default"
    },

    "input:checked:disabled + &": {
      color: tokens.disabled.foreground
    }
  }
}
