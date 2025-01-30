import { useKeystone, useList } from "@keystone/keystoneProvider";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useRouter } from "next/navigation";
import { models } from "@keystone/models";
import { getNamesFromList } from "@keystone/utils/getNamesFromList";
import { Fields } from "../../components/Fields";
import { GraphQLErrorNotice } from "../../components/GraphQLErrorNotice";
import { Container } from "../../components/Container";
import { AdminLink } from "../../components/AdminLink";
import { Button } from "../../primitives/default/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../primitives/default/ui/breadcrumb";
import { basePath } from "@keystone/index";
import { PageBreadcrumbs } from "../../components/PageBreadcrumbs";

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

  const adminPath = basePath;

  return (
    <>
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "model",
            label: list.label,
            href: `/${list.path}`,
            showModelSwitcher: true,
          },
          {
            type: "page",
            label: "Create",
          },
        ]}
      />

      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex-col items-center">
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
          <div className="-mb-4 md:-mb-6 shadow-sm bottom-0 border border-b-0 flex justify-between p-2 rounded-t-xl sticky z-20 mt-5 bg-background">
            <div></div>
            <div className="flex items-center gap-2">
              <Button
                isLoading={createItem.state === "loading"}
                onClick={async () => {
                  const item = await createItem.create();
                  if (item) {
                    router.push(`${adminPath}/${list.path}/${item.id}`);
                  }
                }}
                className="rounded-t-[calc(theme(borderRadius.lg)-1px)]"
              >
                Create {list.singular}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
