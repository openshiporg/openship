import { useTheme } from "@keystone-ui/core"

export const ControlLabel = ({
  children,
  className,
  control,
  size: sizeKey = "medium"
}) => {
  const { controlSizes, spacing, typography } = useTheme()

  const size = controlSizes[sizeKey]

  return (
    <label
      className={className}
      css={{ alignItems: "flex-start", display: "inline-flex" }}
    >
      {control}
      {children && (
        <div
          css={{
            fontSize: size.fontSize,
            lineHeight: typography.leading.tight,
            marginLeft: spacing.small,
            userSelect: "none"
          }}
        >
          {children}
        </div>
      )}
    </label>
  )
}
