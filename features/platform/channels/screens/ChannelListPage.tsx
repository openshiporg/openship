import { getListByPath } from "@/features/dashboard/actions";
import { getFilteredChannelsWithPlatform, getChannelPlatforms } from "../actions";
import { PageBreadcrumbs } from "@/features/dashboard/components/PageBreadcrumbs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Circle, Square, Triangle } from "lucide-react";
import { ChannelListClient } from "../components/ChannelListClient";
import { PlatformFilterBar } from '@/features/platform/components/PlatformFilterBar';
import { ChannelsPageClient } from "../components/ChannelsPageClient";
import { CreateChannel } from "../components/CreateChannel";

// Define Channel type
interface Channel {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  platform?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  channelItems?: Array<{
    id: string;
  }>;
  links?: Array<{
    id: string;
  }>;
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

export async function ChannelListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Parse search parameters
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = Number(resolvedSearchParams.pageSize) || 10;
  const search = typeof resolvedSearchParams.search === "string" && resolvedSearchParams.search !== "" ? resolvedSearchParams.search : null;

  // Get platform from URL
  const platformParam = resolvedSearchParams.platform;
  const selectedPlatform = typeof platformParam === "string" ? platformParam : null;

  // Get sort from URL
  const sortBy = resolvedSearchParams.sortBy as string | undefined;
  const sort = sortBy ? {
    field: sortBy.startsWith("-") ? sortBy.slice(1) : sortBy,
    direction: sortBy.startsWith("-") ? "DESC" : "ASC"
  } : null;

  try {
    // Get list metadata
    const list = await getListByPath("channels");

    if (!list) {
      return (
        <ErrorDisplay
          title="Invalid List"
          message="The requested list could not be found."
        />
      );
    }

    // Fetch platforms
    const platformsResponse = await getChannelPlatforms();
    const platforms = platformsResponse.success ? (platformsResponse.data?.channelPlatforms || []) : [];

    // Fetch channels with filters
    const response = await getFilteredChannelsWithPlatform(
      search,
      selectedPlatform,
      page,
      pageSize,
      sort
    );

    let channels: Channel[] = [];
    let count = 0;

    if (response.success) {
      channels = response.data?.items || [];
      count = response.data?.count || 0;
    } else {
      console.error("Error fetching channels:", response.error);
    }

    return (
      <section
        aria-label="Channels overview"
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
              label: "Channels",
            },
          ]}
        />

        <div className="flex flex-col flex-1 min-h-0">
          <div className="border-gray-200 dark:border-gray-800">
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                Channels
              </h1>
              <p className="text-muted-foreground">
                <span>Create and manage your connected channels</span>
              </p>
            </div>
          </div>

          <div className="px-4 md:px-6">
            <PlatformFilterBar
              list={{
                key: list.key,
                path: list.path,
                label: list.label,
                singular: list.singular,
                plural: list.plural,
                description: list.description || undefined,
                labelField: list.labelField as string,
                initialColumns: list.initialColumns,
                groups: list.groups as unknown as string[],
                graphql: {
                  plural: list.plural,
                  singular: list.singular
                },
                fields: list.fields
              }}
              customCreateButton={<CreateChannel />}
            />
          </div>

          <ChannelsPageClient
            platforms={platforms.map(p => ({
              id: p.id,
              name: p.name,
              channelsCount: p.channels?.length || 0
            }))}
            totalCount={count}
          />

          <div className="flex-1 overflow-auto">
            {channels && channels.length > 0 ? (
              <ChannelListClient channels={channels} />
            ) : (
              <div className="flex items-center justify-center h-full py-10">
                <div className="text-center">
                  <div className="relative h-11 w-11 mx-auto mb-2">
                    <Triangle className="absolute left-1 top-1 w-4 h-4 fill-indigo-200 stroke-indigo-400 dark:stroke-indigo-600 dark:fill-indigo-950 rotate-[90deg]" />
                    <Square className="absolute right-[.2rem] top-1 w-4 h-4 fill-orange-300 stroke-orange-500 dark:stroke-amber-600 dark:fill-amber-950 rotate-[30deg]" />
                    <Circle className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-900" />
                  </div>
                  <p className="font-medium">No channels found</p>
                  <p className="text-muted-foreground text-sm">
                    {(search !== null) || selectedPlatform
                      ? "Try adjusting your search or filter criteria"
                      : "Connect your first channel to get started"}
                  </p>
                  {((search !== null) || selectedPlatform) && (
                    <Link href="/dashboard/platform/channels">
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
      </section>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <ErrorDisplay
        title="Error Loading Channels"
        message={`There was an error loading channels: ${errorMessage}`}
      />
    );
  }
}
