import { getShopWebhooks as executeGetShopWebhooks } from "../../utils/shopProviderAdapter";

interface GetShopWebhooksArgs {
  shopId: string;
}

async function getShopWebhooks(
  root: any,
  { shopId }: GetShopWebhooksArgs,
  context: any
) {
  try {
    // Fetch the shop using the provided shopId
    const shop = await context.query.Shop.findOne({
      where: { id: shopId },
      query: "id domain accessToken platform { id getWebhooksFunction }",
    });

    
    if (!shop) {
      throw new Error("Shop not found");
    }

    if (!shop.platform) {
      throw new Error("Platform configuration not specified.");
    }

    const result = await executeGetShopWebhooks({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken,
      },
    });

    return result.webhooks;
  } catch (error: any) {
    throw new Error(`Error getting shop webhooks: ${error.message}`);
  }
}

export default getShopWebhooks;