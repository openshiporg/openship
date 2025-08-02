import { deleteShopWebhook as executeDeleteShopWebhook } from "../../utils/shopProviderAdapter";

interface DeleteShopWebhookArgs {
  shopId: string;
  webhookId: string;
}

async function deleteShopWebhook(
  root: any,
  { shopId, webhookId }: DeleteShopWebhookArgs,
  context: any
) {
  try {
    // Fetch the shop using the provided shopId
    const shop = await context.query.Shop.findOne({
      where: { id: shopId },
      query: "id domain accessToken platform { id deleteWebhookFunction }",
    });

    if (!shop) {
      return { success: false, error: "Shop not found" };
    }

    if (!shop.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }

    await executeDeleteShopWebhook({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken,
      },
      webhookId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default deleteShopWebhook;