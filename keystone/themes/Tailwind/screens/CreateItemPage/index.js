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
      <Container>
        <div className="flex">
          <nav className="pb-2 rounded-lg" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <AdminLink
                  href="/"
                  className="inline-flex items-center text-md font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                >
                  <svg
                    className="w-3 h-3 mr-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                  </svg>
                  Home
                </AdminLink>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 mx-1 text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  {list.isSingleton ? (
                    <div className="ml-1 text-md font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                      {list.label}
                    </div>
                  ) : (
                    <AdminLink
                      href={`/${list.path}`}
                      className="ml-1 text-md font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
                    >
                      {list.label}
                    </AdminLink>
                  )}
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 mx-1 text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <div className="ml-1 text-md font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                    Create
                  </div>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex items-center justify-between pt-8 pb-4">
          <div className="grid gap-1">
            <h1 className="items-center flex font-bold text-3xl md:text-4xl">
              Create {list.label}
            </h1>
            <p className="text-lg text-muted-foreground">Create new items</p>
          </div>
        </div>
      </Container>

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
              size="lg"
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
