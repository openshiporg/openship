import { createShopWebhook as executeCreateShopWebhook } from "../../utils/shopProviderAdapter";

interface CreateShopWebhookArgs {
  shopId: string;
  topic: string;
  endpoint: string;
}

async function createShopWebhook(
  root: any,
  { shopId, topic, endpoint }: CreateShopWebhookArgs,
  context: any
) {

  try {
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
          createWebhookFunction
        }
      `,
    });


    if (!shop) {
      return { success: false, error: "Shop not found" };
    }

    if (!shop.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }

    if (!shop.platform.createWebhookFunction) {
      return { success: false, error: "Create webhook function not configured." };
    }

    // Prepare platform configuration (matching getShopProduct pattern)
    const platformConfig = {
      domain: shop.domain,
      accessToken: shop.accessToken,
      createWebhookFunction: shop.platform.createWebhookFunction,
      ...shop.metadata,
    };

    const result = await executeCreateShopWebhook({
      platform: platformConfig,
      endpoint,
      events: [topic],
    });


    return { success: true, webhookId: result.webhookId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default createShopWebhook;