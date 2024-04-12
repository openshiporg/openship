import { Fields } from "@keystone/components/Fields";
import { useKeystone, useList } from "@keystone/keystoneProvider";
import { GraphQLErrorNotice } from "@keystone/components/GraphQLErrorNotice";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { Container } from "@keystone/components/Container";
import { AdminLink } from "@keystone/components/AdminLink";

import { useRouter } from "next/navigation";
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@keystone/primitives/default/ui/breadcrumb";
import Link from "next/link";

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
  const createItem = useCreateItem(list);

  const router = useRouter();

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/dashboard";

  return (
    <Container>
      <div>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                {list.isSingleton ? (
                  <div className="ml-1 text-md font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                    {list.label}
                  </div>
                ) : (
                  <AdminLink href={`/${list.path}`}>{list.label}</AdminLink>
                )}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Create</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div className="flex-col items-center mt-2 mb-4">
            <h1 className="text-lg font-semibold md:text-2xl">
              Create {list.singular}
            </h1>
            <p className="text-muted-foreground">
              {list.description ? (
                <p>{list.description}</p>
              ) : (
                <span>
                  Create and manage{" "}
                  <span className="lowercase">{list.label}</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div>
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
        <div>
          {createItem.error && (
            <GraphQLErrorNotice
              networkError={createItem.error?.networkError}
              errors={createItem.error?.graphQLErrors}
            />
          )}
          <Fields {...createItem.props} />
          <div className="mt-10 flex">
            <Button
              isLoading={createItem.state === "loading"}
              color="blue"
              onClick={async () => {
                const item = await createItem.create();
                if (item) {
                  router.push(`${adminPath}/${list.path}/${item.id}`);
                }
              }}
              // size="lg"
              className="ml-auto"
            >
              Create {list.singular}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
};
