/** @jsxRuntime classic */
/** @jsx jsx */

import { Heading, jsx, useTheme, Box } from "@keystone-ui/core";
import { ChevronRightIcon } from "@keystone-ui/icons/icons/ChevronRightIcon";
import { Button } from "@keystone-ui/button";
import { Fields } from "@keystone/components/Fields";
import { PageContainer } from "@keystone/components/PageContainer";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { GraphQLErrorNotice } from "@keystone/components/GraphQLErrorNotice";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { Container } from "@keystone/components/Container";
import { AdminLink } from "@keystone/components/AdminLink";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";

export const CreateItemPage = ({ params }) => {
  const listKey = params.listKey;

  const listsObject = {};
  for (const [key, list] of Object.entries(models)) {
    const { adminUILabels } = getNamesFromList(key, list);
    listsObject[adminUILabels.path] = key;
  }
  const key = listsObject[listKey];

  const list = useList(key); // Retrieve the list using the key
  const { createViewFieldModes } = useKeystone();
  const { palette, spacing, colors } = useTheme();
  const createItem = useCreateItem(list);

  const router = useRouter();

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/dashboard";

  return (
    <PageContainer
      title={`Create ${list.singular}`}
      header={
        <Container
          css={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <div
            css={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              minWidth: 0,
            }}
          >
            {list.isSingleton ? (
              <Heading type="h3">{list.label}</Heading>
            ) : (
              <Fragment>
                <Heading type="h3">
                  <AdminLink href={`/${list.path}`} css={{ textDecoration: "none" }}>
                    {list.label}
                  </AdminLink>
                </Heading>
                <div
                  css={{
                    color: palette.neutral500,
                    marginLeft: spacing.xsmall,
                    marginRight: spacing.xsmall,
                  }}
                >
                  <ChevronRightIcon />
                </div>
                <Heading
                  as="h1"
                  type="h3"
                  css={{
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                    flex: 1,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Create
                </Heading>
              </Fragment>
            )}
          </div>
        </Container>
      }
    >
      <Container css={{ position: "relative", height: "100%" }}>
        <div
          css={{
            alignItems: "start",
            display: "grid",
            gap: spacing.xlarge,
            gridTemplateColumns: `2fr 1fr`,
          }}
        >
          <Box>
            {createViewFieldModes.state === "error" && (
              <GraphQLErrorNotice
                networkError={
                  createViewFieldModes.error instanceof Error
                    ? createViewFieldModes.error
                    : undefined
                }
                errors={
                  createViewFieldModes.error instanceof Error
                    ? undefined
                    : createViewFieldModes.error
                }
              />
            )}
            {createViewFieldModes.state === "loading" && (
              <div label="Loading create form" />
            )}
            <Box paddingTop="xlarge">
              {createItem.error && (
                <GraphQLErrorNotice
                  networkError={createItem.error?.networkError}
                  errors={createItem.error?.graphQLErrors}
                />
              )}
              <Fields {...createItem.props} />
              <div
                css={{
                  background: colors.background,
                  borderTop: `1px solid ${colors.border}`,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: spacing.xlarge,
                  paddingBottom: spacing.xlarge,
                  paddingTop: spacing.xlarge,
                  position: "sticky",
                  zIndex: 20,
                }}
              >
                <Button
                  isLoading={createItem.state === "loading"}
                  weight="bold"
                  tone="active"
                  onClick={async () => {
                    const item = await createItem.create();
                    if (item) {
                      router.push(`${adminPath}/${list.path}/${item.id}`);
                    }
                  }}
                >
                  Create {list.singular}
                </Button>
              </div>
            </Box>
          </Box>
        </div>
      </Container>
    </PageContainer>
  );
};
