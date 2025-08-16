import { getListByPath } from "@/features/dashboard/actions";
import { getApiKeys } from "../actions/getApiKeys";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Circle, Square, Triangle } from "lucide-react";
import { CreateApiKey } from "../components/CreateApiKey";
import { Pagination } from "@/features/dashboard/components/Pagination";
import ApiKeyTable from "../components/ApiKeyTable";

// Define ApiKey type
interface ApiKey {
  id: string;
  name: string;
  tokenPreview: string;
  scopes: string[];
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount?: { total: number; daily: Record<string, number> };
  restrictedToIPs?: string[];
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function ErrorDisplay({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-red-600">
        {title}
      </h1>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}

export async function ApiKeyListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Parse search parameters
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = Number(resolvedSearchParams.pageSize) || 10;
  const search = typeof resolvedSearchParams.search === "string" && resolvedSearchParams.search !== "" ? resolvedSearchParams.search : null;

  // Get sort from URL
  const sortBy = resolvedSearchParams.sortBy as string | undefined;
  const sort = sortBy ? {
    field: sortBy.startsWith("-") ? sortBy.slice(1) : sortBy,
    direction: (sortBy.startsWith("-") ? "DESC" : "ASC") as "ASC" | "DESC"
  } : null;

  try {
    // Get list metadata
    const list = await getListByPath("api-keys");

    if (!list) {
      return (
        <ErrorDisplay
          title="Invalid List"
          message="The requested list could not be found."
        />
      );
    }

    // Fetch API keys 
    const [response] = await Promise.all([
      getApiKeys(
        {},
        pageSize,
        (page - 1) * pageSize,
        sort ? [{ [sort.field]: sort.direction.toLowerCase() }] : [{ createdAt: 'desc' }]
      )
    ]);

    let apiKeys: ApiKey[] = [];
    let count = 0;

    if (response.success) {
      apiKeys = response.data?.items || [];
      count = response.data?.count || 0;
    } else {
      console.error("Error fetching API keys:", response.error);
    }

    return (
      <section
        aria-label="API Keys overview"
        className="overflow-hidden flex flex-col"
      >
        <PageBreadcrumbs
          items={[
            {
              type: "link",
              label: "Dashboard",
              href: "/",
            },
            {
              type: "page",
              label: "Platform",
            },
            {
              type: "page",
              label: "API Keys",
            },
          ]}
        />

        <div className="flex flex-col flex-1 min-h-0">
          <div className="border-gray-200 dark:border-gray-800">
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                API Keys
              </h1>
              <p className="text-muted-foreground">
                <span>Create and manage secure API keys for programmatic access</span>
              </p>
            </div>
          </div>

          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center space-x-2">
                {/* Search and filters for API keys */}
              </div>
              <CreateApiKey />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {apiKeys && apiKeys.length > 0 ? (
              <ApiKeyTable data={apiKeys} />
            ) : (
              <div className="flex items-center justify-center h-full py-10">
                <div className="text-center">
                  <div className="relative h-11 w-11 mx-auto mb-2">
                    <Triangle className="absolute left-1 top-1 w-4 h-4 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950 rotate-[90deg]" />
                    <Square className="absolute right-[.2rem] top-1 w-4 h-4 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950 rotate-[30deg]" />
                    <Circle className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-900" />
                  </div>
                  <p className="font-medium">No API keys found</p>
                  <p className="text-muted-foreground text-sm">
                    {search !== null
                      ? "Try adjusting your search criteria"
                      : "Create your first API key to get started"}
                  </p>
                  {search !== null && (
                    <Link href="/dashboard/platform/api-keys">
                      <Button variant="outline" className="mt-4" size="sm">
                        Clear filters
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {apiKeys && apiKeys.length > 0 && (
          <Pagination
            currentPage={page}
            total={count}
            pageSize={pageSize}
            list={{
              singular: "API Key",
              plural: "API Keys"
            }}
          />
        )}
      </section>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <ErrorDisplay
        title="Error Loading API Keys"
        message={`There was an error loading API keys: ${errorMessage}`}
      />
    );
  }
}