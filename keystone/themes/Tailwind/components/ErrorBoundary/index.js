/** @jsxRuntime classic */
/** @jsx jsx */

import { Component } from "react"
import { Button } from "@keystone-ui/button"
import { jsx, Box, Center, Stack, useTheme } from "@keystone-ui/core"
import { AlertTriangleIcon } from "@keystone-ui/icons/icons/AlertTriangleIcon"

export class ErrorBoundary extends Component {
  state = { hasError: false, isReloading: false }
  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }
  reloadPage = () => {
    this.setState({ isReloading: true })
    window.location.reload()
  }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <Stack align="center" gap="medium">
            <AlertTriangleIcon size="large" />
            <div>Something went wrong.</div>
            <Button
              size="small"
              isLoading={this.state.isReloading}
              onClick={this.reloadPage}
            >
              reload page
            </Button>
          </Stack>
        </ErrorContainer>
      )
    }
    return this.props.children
  }
}

export const ErrorContainer = ({ children }) => {
  const { colors, shadow } = useTheme()
  return (
    <Center
      css={{
        minWidth: "100vw",
        minHeight: "100vh",
        backgroundColor: colors.backgroundMuted
      }}
      rounding="medium"
    >
      <Box
        css={{
          background: colors.background,
          boxShadow: shadow.s100
        }}
        margin="medium"
        padding="xlarge"
        rounding="medium"
      >
        {children}
      </Box>
    </Center>
  )
}
