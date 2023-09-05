/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, useTheme } from "@keystone-ui/core";
import { Navigation } from "@keystone/components/Navigation";
import { Logo } from "@keystone/components/Logo";
import { Fragment } from "react";

export const HEADER_HEIGHT = 80;

const PageWrapper = (props) => {
  // const { colors } = useTheme();
  return (
    <Fragment>
      {/* TODO: not sure where to put this */}
      <style>{`body { overflow: hidden; background: white; }`}</style>
      <div
        css={{
          // background: colors.background,
          display: "grid",
          gridTemplateColumns: `minmax(300px, 1fr) 4fr`,
          gridTemplateRows: `${HEADER_HEIGHT}px auto`,
          height: "100vh",
          isolation: "isolate",
        }}
        {...props}
      />
    </Fragment>
  );
};

const Sidebar = (props) => {
  // const { colors } = useTheme();

  return (
    <aside
      css={{
        // borderRight: `1px solid ${colors.border}`,
        minWidth: 0, // resolves collapsing issues in children
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
      {...props}
    />
  );
};

const Content = (props) => {
  const { colors, spacing } = useTheme();

  return (
    <main
      css={{
        backgroundColor: colors.background,
        boxSizing: "border-box",
        minWidth: 0, // resolves collapsing issues in children
        paddingLeft: spacing.xlarge,
        paddingRight: spacing.xlarge,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        position: "relative",
      }}
      {...props}
    />
  );
};

export const PageContainer = ({ children, header, title }) => {
  const { colors, spacing } = useTheme();
  return (
    <PageWrapper>
      <div
        css={{
          alignItems: "center",
          // borderRight: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: spacing.xlarge,
          paddingRight: spacing.xlarge,
        }}
      >
        <Logo />
      </div>
      <header
        css={{
          alignItems: "center",
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          minWidth: 0, // fix flex text truncation
          paddingLeft: spacing.xlarge,
          paddingRight: spacing.xlarge,
        }}
      >
        <title>{title ? `Keystone - ${title}` : "Keystone"}</title>
        {header}
      </header>
      <Sidebar>
        <Navigation />
      </Sidebar>
      <Content>{children}</Content>
    </PageWrapper>
  );
};
