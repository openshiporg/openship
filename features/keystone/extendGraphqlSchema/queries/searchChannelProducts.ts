'use server';

import { searchChannelProducts } from '../../utils/channelProviderAdapter';

async function searchChannelProductsQuery(
  root: any,
  {
    channelId,
    searchEntry,
    after,
  }: { channelId: string; searchEntry: string; after?: string },
  context: any,
) {
  console.log("helllooooo")
  const sudoContext = context.sudo();

  // Fetch the channel using the provided channelId
  const channel = await sudoContext.query.Channel.findOne({
    where: { id: channelId },
    query: `
      id
      domain
      accessToken
      metadata
      platform {
        id
        name
        searchProductsFunction
      }
    `,
  });

  if (!channel) {
    throw new Error('Channel not found');
  }

  if (!channel.platform) {
    throw new Error('Platform configuration not specified.');
  }

  if (!channel.platform.searchProductsFunction) {
    throw new Error('Search products function not configured.');
  }

  // Prepare platform configuration
  const platformConfig = {
    domain: channel.domain,
    accessToken: channel.accessToken,
    searchProductsFunction: channel.platform.searchProductsFunction,
    ...channel.metadata,
  };

  try {
    const result = await searchChannelProducts({
      platform: platformConfig,
      searchEntry: searchEntry || '',
      after,
    });

    return result.products;
  } catch (error: any) {
    console.error('Error searching channel products:', error);
    throw new Error(`Failed to search products: ${error.message}`);
  }
}

export default searchChannelProductsQuery;