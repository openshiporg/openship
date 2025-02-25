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
import { Check } from "lucide-react";
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

  const list = useList(key);
  const { createViewFieldModes } = useKeystone();
  const createItem = useCreateItem(list);
  const router = useRouter();
  const adminPath = basePath;

  const actions = (
    <Button
      className="relative pe-12"
      size="sm"
      isLoading={createItem.state === "loading"}
      onClick={async () => {
        const item = await createItem.create();
        if (item) {
          router.push(`${adminPath}/${list.path}/${item.id}`);
        }
      }}
    >
      Create {list.singular}
      <span className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center bg-primary-foreground/15">
        <Check className="opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
      </span>
    </Button>
  );

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
        actions={actions}
      />

      <main className="w-full max-w-4xl p-4 md:p-6 flex flex-col gap-4">
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
        </div>
      </main>
    </>
  );
};
