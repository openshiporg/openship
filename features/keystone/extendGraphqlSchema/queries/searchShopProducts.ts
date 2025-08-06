"use server";

import { searchShopProducts } from "../../utils/shopProviderAdapter";

async function searchShopProductsQuery(
  root: any,
  { shopId, searchEntry, after }: { shopId: string; searchEntry: string; after?: string },
  context: any
) {
  const sudoContext = context.sudo();

  // Fetch the shop using the provided shopId
  const shop = await sudoContext.query.Shop.findOne({
    where: { id: shopId },
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

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.searchProductsFunction) {
    throw new Error("Search products function not configured.");
  }

  // Prepare platform configuration
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata,
  };

  try {
    const result = await searchShopProducts({
      platform: {
        ...shop.platform,
        ...platformConfig,
      },
      searchEntry: searchEntry || "",
      after,
    });

    return result.products;
  } catch (error) {
    console.error("Error searching shop products:", error);
    throw new Error(`Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default searchShopProductsQuery;