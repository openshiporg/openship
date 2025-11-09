import { getListByPath } from "@/features/dashboard/actions";
import { getFilteredShopsWithPlatform, getShopPlatforms } from "../actions";
import { getFilteredChannels } from "@/features/platform/channels/actions";
import { ShopListPageClient } from "./ShopListPageClient";
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function ShopListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchParamsObj = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  // Get list metadata
  const list = await getListByPath("shops");

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
  const [platformsResponse, shopsResponse, channelsData] = await Promise.all([
    getShopPlatforms(),
    getFilteredShopsWithPlatform(
      searchString || null,
      selectedPlatform,
      currentPage,
      pageSize,
      null
    ),
    getFilteredChannels(null, 1, 100)
  ]);

  const platforms = platformsResponse.success ? (platformsResponse.data?.shopPlatforms || []) : []
  const shops = shopsResponse.success ? shopsResponse.data?.items || [] : []
  const channels = channelsData.success ? channelsData.data?.items || [] : []
  const count = shopsResponse.success ? shopsResponse.data?.count || 0 : 0

  const initialData = {
    items: shops,
    count: count
  }

  const error = shopsResponse.success ? null : shopsResponse.error || 'Failed to load shops'

  return (
    <ShopListPageClient
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
      shops={shops}
      channels={channels}
      searchParams={{
        showCreateShop: typeof resolvedSearchParams.showCreateShop === "string" ? resolvedSearchParams.showCreateShop : undefined,
        platform: typeof resolvedSearchParams.platform === "string" ? resolvedSearchParams.platform : undefined,
        accessToken: typeof resolvedSearchParams.accessToken === "string" ? resolvedSearchParams.accessToken : undefined,
        domain: typeof resolvedSearchParams.domain === "string" ? resolvedSearchParams.domain : undefined,
        client_id: typeof resolvedSearchParams.client_id === "string" ? resolvedSearchParams.client_id : undefined,
        client_secret: typeof resolvedSearchParams.client_secret === "string" ? resolvedSearchParams.client_secret : undefined,
        app_name: typeof resolvedSearchParams.app_name === "string" ? resolvedSearchParams.app_name : undefined,
        adapter_slug: typeof resolvedSearchParams.adapter_slug === "string" ? resolvedSearchParams.adapter_slug : undefined,
        code: typeof resolvedSearchParams.code === "string" ? resolvedSearchParams.code : undefined,
        scope: typeof resolvedSearchParams.scope === "string" ? resolvedSearchParams.scope : undefined,
        redirect_uri: typeof resolvedSearchParams.redirect_uri === "string" ? resolvedSearchParams.redirect_uri : undefined,
        state: typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : undefined,
        refreshToken: typeof resolvedSearchParams.refreshToken === "string" ? resolvedSearchParams.refreshToken : undefined,
        tokenExpiresAt: typeof resolvedSearchParams.tokenExpiresAt === "string" ? resolvedSearchParams.tokenExpiresAt : undefined,
      }}
    />
  )
}
