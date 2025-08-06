"use server";

import { getShopProduct } from "../../utils/shopProviderAdapter";

async function getShopProductQuery(
  root: any,
  { shopId, productId, variantId }: { shopId: string; productId: string; variantId?: string },
  context: any
) {
  // Validate input parameters
  if (!shopId || typeof shopId !== 'string') {
    throw new Error("Valid shop ID is required");
  }

  if (!productId || typeof productId !== 'string') {
    throw new Error("Valid product ID is required");
  }

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
        getProductFunction
      }
    `,
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.getProductFunction) {
    throw new Error("Get product function not configured.");
  }

  // Prepare platform configuration
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    getProductFunction: shop.platform.getProductFunction,
    ...shop.metadata,
  };

  try {
    const result = await getShopProduct({
      platform: platformConfig,
      productId: productId,
      variantId: variantId,
    });

    // Extract product data from result
    const productData = result.product || result;

    // Enhance the result with inventory information and platform data
    return {
      ...productData,
      shopId: shop.id,
      shopDomain: shop.domain,
      platformName: shop.platform.name,
      fetchedAt: new Date().toISOString(),
      // Include live inventory levels if available
      inventoryLevel: productData.inventory || null,
      inventoryTracked: productData.inventoryTracked || false,
      // Include pricing information
      price: productData.price || null,
      compareAtPrice: productData.compareAtPrice || null,
      // Include availability
      availableForSale: productData.availableForSale || false,
    };
  } catch (error) {
    console.error("Error getting shop product:", error);
    throw new Error(`Failed to get product from ${shop.platform.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default getShopProductQuery;