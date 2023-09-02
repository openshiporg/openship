/** @jsxRuntime classic */
/** @jsx jsx */

import { useMemo } from "react";

import {
  jsx,
  Center,
  Inline,
  Heading,
  VisuallyHidden,
  useTheme,
} from "@keystone-ui/core";
import { PlusIcon } from "@keystone-ui/icons/icons/PlusIcon";
import { LoadingDots } from "@keystone-ui/loading";
import { makeDataGetter } from "@keystone-6/core/admin-ui/utils";
import { PageContainer } from "@keystone/components/PageContainer";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { AdminLink } from "@keystone/components/AdminLink";

const HEADER_HEIGHT = 80;

const ListCard = ({ listKey, count, hideCreate }) => {
  const { colors, palette, radii, spacing } = useTheme();
  const list = useList(listKey);
  return (
    <div css={{ position: "relative" }}>
      <AdminLink
        href={`/${list.path}${list.isSingleton ? "/1" : ""}`}
        css={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderRadius: radii.medium,
          borderWidth: 1,
          // boxShadow: shadow.s100,
          display: "inline-block",
          minWidth: 280,
          padding: spacing.large,
          textDecoration: "none",

          ":hover": {
            borderColor: palette.blue400,
          },
          ":hover h3": {
            textDecoration: "underline",
          },
        }}
      >
        <h3 css={{ margin: `0 0 ${spacing.small}px 0` }}>{list.label} </h3>
        {list.isSingleton ? null : count.type === "success" ? (
          <span css={{ color: colors.foreground, textDecoration: "none" }}>
            {count.count} item{count.count !== 1 ? "s" : ""}
          </span>
        ) : count.type === "error" ? (
          count.message
        ) : count.type === "loading" ? (
          <LoadingDots
            label={`Loading count of ${list.plural}`}
            size="small"
            tone="passive"
          />
        ) : (
          "No access"
        )}
      </AdminLink>
      {hideCreate === false && !list.isSingleton && (
        <CreateButton
          title={`Create ${list.singular}`}
          href={`/${list.path}/create`}
        >
          <PlusIcon size="large" />
          <VisuallyHidden>Create {list.singular}</VisuallyHidden>
        </CreateButton>
      )}
    </div>
  );
};

const CreateButton = (props) => {
  const theme = useTheme();
  return (
    <AdminLink
      css={{
        alignItems: "center",
        backgroundColor: theme.palette.neutral400,
        border: 0,
        borderRadius: theme.radii.xsmall,
        color: "white",
        cursor: "pointer",
        display: "flex",
        height: 32,
        justifyContent: "center",
        outline: 0,
        position: "absolute",
        right: theme.spacing.large,
        top: theme.spacing.large,
        transition: "background-color 80ms linear",
        width: 32,
        "&:hover, &:focus": {
          color: "white",
          backgroundColor: theme.tones.positive.fill[0],
        },
      }}
      {...props}
    />
  );
};

export const HomePage = () => {
  const {
    adminMeta: { lists },
    visibleLists,
  } = useKeystone();
  const query = useMemo(
    () => gql`
  query {
    keystone {
      adminMeta {
        lists {
          key
          hideCreate
        }
      }
    }
    ${Object.values(lists)
      .filter((list) => !list.isSingleton)
      .map((list) => `${list.key}: ${list.gqlNames.listQueryCountName}`)
      .join("\n")}
  }`,
    [lists]
  );
  let { data, error } = useQuery(query, { errorPolicy: "all" });

  const dataGetter = makeDataGetter(data, error?.graphQLErrors);

  return (
    <PageContainer header={<Heading type="h3">Dashboard</Heading>}>
      {visibleLists.state === "loading" ? (
        <Center css={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          <LoadingDots label="Loading lists" size="large" tone="passive" />
        </Center>
      ) : (
        <Inline
          as="ul"
          gap="large"
          paddingY="xlarge"
          css={{
            paddingLeft: "0px",
            marginBottom: "0px",
          }}
        >
          {(() => {
            if (visibleLists.state === "error") {
              return (
                <span css={{ color: "red" }}>
                  {visibleLists.error instanceof Error
                    ? visibleLists.error.message
                    : visibleLists.error[0].message}
                </span>
              );
            }
            return Object.keys(lists).map((key) => {
              if (!visibleLists.lists.has(key)) {
                return null;
              }
              const result = dataGetter.get(key);
              return (
                <ListCard
                  count={
                    data
                      ? result.errors
                        ? { type: "error", message: result.errors[0].message }
                        : { type: "success", count: data[key] }
                      : { type: "loading" }
                  }
                  hideCreate={
                    data?.keystone.adminMeta.lists.find(
                      (list) => list.key === key
                    )?.hideCreate ?? false
                  }
                  key={key}
                  listKey={key}
                />
              );
            });
          })()}
        </Inline>
      )}
    </PageContainer>
  );
};
