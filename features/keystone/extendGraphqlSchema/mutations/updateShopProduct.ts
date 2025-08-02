import { updateShopProduct as executeUpdateShopProduct } from "../../utils/shopProviderAdapter";

async function updateShopProduct(
  root: any,
  { shopId, variantId, productId, price, inventoryDelta }: {
    shopId: string;
    variantId: string;
    productId: string;
    price?: string;
    inventoryDelta?: number;
  },
  context: any
) {
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
        updateProductFunction
      }
    `,
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  // Create platform config with domain, accessToken, and metadata
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata,
  };

  try {
    const result = await executeUpdateShopProduct({
      platform: {
        ...shop.platform,
        ...platformConfig,
      },
      productId,
      variantId,
      inventory: inventoryDelta,
      price,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, updatedVariant: result.updatedVariant };
  } catch (error: any) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

export default updateShopProduct;