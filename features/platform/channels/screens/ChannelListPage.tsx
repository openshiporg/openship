import { getListByPath } from "@/features/dashboard/actions";
import { getFilteredChannelsWithPlatform, getChannelPlatforms } from "../actions";
import { ChannelListPageClient } from "./ChannelListPageClient";
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function ChannelListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchParamsObj = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  // Get list metadata
  const list = await getListByPath("channels");

  if (!list) {
    notFound()
  }

  // Parse search params
  const currentPage = parseInt(searchParamsObj.page?.toString() || '1', 10) || 1
  const pageSize = parseInt(searchParamsObj.pageSize?.toString() || list.pageSize?.toString() || '50', 10)
  const searchString = searchParamsObj.search?.toString() || ''

  // Get platform from URL - using Keystone filter format (!platform_is)
  const platformFilter = searchParamsObj["!platform_is"];
  let selectedPlatform: string | null = null;

  if (platformFilter && typeof platformFilter === "string") {
    try {
      selectedPlatform = JSON.parse(decodeURIComponent(platformFilter));
    } catch (e) {
      selectedPlatform = null;
    }
  }

  // Fetch platforms and initial data for SSR
  const [platformsResponse, channelsResponse] = await Promise.all([
    getChannelPlatforms(),
    getFilteredChannelsWithPlatform(
      searchString || null,
      selectedPlatform,
      currentPage,
      pageSize,
      null
    )
  ]);

  const platforms = platformsResponse.success ? (platformsResponse.data?.channelPlatforms || []) : []
  const channels = channelsResponse.success ? channelsResponse.data?.items || [] : []
  const count = channelsResponse.success ? channelsResponse.data?.count || 0 : 0

  const initialData = {
    items: channels,
    count: count
  }

  const error = channelsResponse.success ? null : channelsResponse.error || 'Failed to load channels'

  return (
    <ChannelListPageClient
      list={list}
      initialData={initialData}
      initialError={error}
      initialSearchParams={{
        page: currentPage,
        pageSize,
        search: searchString
      }}
      statusCounts={null}
      platforms={platforms}
      searchParams={{
        showCreateChannel: typeof resolvedSearchParams.showCreateChannel === "string" ? resolvedSearchParams.showCreateChannel : undefined,
        platform: typeof resolvedSearchParams.platform === "string" ? resolvedSearchParams.platform : undefined,
        accessToken: typeof resolvedSearchParams.accessToken === "string" ? resolvedSearchParams.accessToken : undefined,
        domain: typeof resolvedSearchParams.domain === "string" ? resolvedSearchParams.domain : undefined,
        client_id: typeof resolvedSearchParams.client_id === "string" ? resolvedSearchParams.client_id : undefined,
        client_secret: typeof resolvedSearchParams.client_secret === "string" ? resolvedSearchParams.client_secret : undefined,
        app_name: typeof resolvedSearchParams.app_name === "string" ? resolvedSearchParams.app_name : undefined,
        adapter_slug: typeof resolvedSearchParams.adapter_slug === "string" ? resolvedSearchParams.adapter_slug : undefined,
        scope: typeof resolvedSearchParams.scope === "string" ? resolvedSearchParams.scope : undefined,
        redirect_uri: typeof resolvedSearchParams.redirect_uri === "string" ? resolvedSearchParams.redirect_uri : undefined,
        state: typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : undefined,
        refreshToken: typeof resolvedSearchParams.refreshToken === "string" ? resolvedSearchParams.refreshToken : undefined,
        tokenExpiresAt: typeof resolvedSearchParams.tokenExpiresAt === "string" ? resolvedSearchParams.tokenExpiresAt : undefined,
      }}
    />
  )
}
