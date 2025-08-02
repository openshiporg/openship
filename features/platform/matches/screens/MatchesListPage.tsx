import { getListByPath } from "@/features/dashboard/actions";
import { getFilteredMatches } from "../actions/matches";
import { getShops } from "@/features/platform/shops/actions/shops";
import { getChannels } from "@/features/platform/channels/actions/channels";
import { MatchesListPageClient } from "./MatchesListPageClient";

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

export default async function MatchesListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Parse search parameters
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = Number(resolvedSearchParams.pageSize) || 10;
  const search = typeof resolvedSearchParams.search === "string" && resolvedSearchParams.search !== "" ? resolvedSearchParams.search : null;

  // Get sort from URL
  const sortBy = resolvedSearchParams.sortBy as string | undefined;
  const sort = sortBy ? {
    field: sortBy.startsWith("-") ? sortBy.slice(1) : sortBy,
    direction: sortBy.startsWith("-") ? "DESC" : "ASC"
  } : null;

  try {
    // Get list metadata
    const list = await getListByPath("matches");

    if (!list) {
      return (
        <ErrorDisplay
          title="Invalid List"
          message="The requested list could not be found."
        />
      );
    }

    // Fetch matches
    const response = await getFilteredMatches(
      search,
      page,
      pageSize,
      sort
    );

    let matches: any[] = [];
    let count = 0;

    if (response.success) {
      matches = response.data?.items || [];
      count = response.data?.count || 0;
    } else {
      console.error("Error fetching matches:", response.error);
    }

    // Fetch shops and channels for the search tabs
    const [shopsResponse, channelsResponse] = await Promise.all([
      getShops(),
      getChannels()
    ]);

    const shops = shopsResponse.success ? shopsResponse.data?.items || [] : [];
    const channels = channelsResponse.success ? channelsResponse.data?.items || [] : [];

    return (
      <MatchesListPageClient
        list={list}
        matches={matches}
        count={count}
        statusCounts={{
          matches: count,
          shop: 0,
          channel: 0
        }}
        searchParams={resolvedSearchParams}
        shops={shops}
        channels={channels}
      />
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <ErrorDisplay
        title="Error Loading Matches"
        message={`There was an error loading matches: ${errorMessage}`}
      />
    );
  }
}