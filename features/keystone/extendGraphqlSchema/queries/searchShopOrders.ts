import type { KeystoneContext } from '@keystone-6/core/types';
import { searchShopOrders as searchShopOrdersExecutor } from "../../utils/shopProviderAdapter";

interface SearchShopOrdersArgs {
  shopId: string;
  searchEntry?: string;
  take: number;
  skip?: number;
  after?: string;
  status?: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function searchShopOrders(
  root: any,
  { shopId, searchEntry, take = 25, skip = 0, after, status, financialStatus, fulfillmentStatus, dateFrom, dateTo }: SearchShopOrdersArgs,
  context: KeystoneContext
) {
  // Validate input parameters
  if (!shopId || typeof shopId !== 'string') {
    throw new Error("Valid shop ID is required");
  }

  if (take > 250) {
    throw new Error("Cannot fetch more than 250 orders at once");
  }

  if (take < 1) {
    throw new Error("Take must be at least 1");
  }
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: `
      id 
      domain 
      accessToken 
      metadata
      platform { 
        id 
        name
        searchOrdersFunction 
        appKey
        appSecret
      }
    `,
  });

  
  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.searchOrdersFunction) {
    throw new Error("Search orders function not configured.");
  }

  // Prepare platform configuration with enhanced filtering
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata,
  };

  // Build advanced filter options
  const filterOptions = {
    searchEntry,
    after,
    take,
    skip,
    // Advanced filtering capabilities
    filters: {
      status: status || undefined,
      financialStatus: financialStatus || undefined,
      fulfillmentStatus: fulfillmentStatus || undefined,
      createdAtMin: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      createdAtMax: dateTo ? new Date(dateTo).toISOString() : undefined,
    },
  };

  try {
    const result = await searchShopOrdersExecutor({
      platform: {
        ...shop.platform,
        ...platformConfig,
      },
      ...filterOptions,
    });

    // Enhance the result with additional metadata
    return {
      orders: result.orders || [],
      pageInfo: {
        hasNextPage: result.pageInfo?.hasNextPage || false,
        hasPreviousPage: result.pageInfo?.hasPreviousPage || false,
        startCursor: result.pageInfo?.startCursor || null,
        endCursor: result.pageInfo?.endCursor || null,
      },
      totalCount: result.totalCount || null,
      shopInfo: {
        id: shop.id,
        domain: shop.domain,
        platformName: shop.platform.name,
      },
      searchMetadata: {
        searchEntry,
        filtersApplied: Object.keys(filterOptions.filters).filter(
          key => (filterOptions.filters as Record<string, any>)[key] !== undefined
        ),
        fetchedAt: new Date().toISOString(),
        resultCount: result.orders?.length || 0,
      },
    };
  } catch (error) {
    console.error(`Error searching orders for shop ${shop.id}:`, error);
    throw new Error(`Failed to search orders from ${shop.platform.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default searchShopOrders;