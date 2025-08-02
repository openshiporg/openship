import { getChannelProduct as executeGetChannelProduct } from "../../utils/channelProviderAdapter";

async function getChannelProduct(
  root: any,
  { channelId, productId, variantId }: {
    channelId: string;
    productId?: string;
    variantId?: string;
  },
  context: any
) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id getProductFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }

  // Prepare platform configuration
  const platformConfig = {
    domain: channel.domain,
    accessToken: channel.accessToken,
    getProductFunction: channel.platform.getProductFunction,
    ...channel.metadata,
  };

  try {
    const result = await executeGetChannelProduct({
      platform: platformConfig,
      productId: productId,
      variantId: variantId,
    });

    return result.product;
  } catch (error: any) {
    throw new Error(`Failed to get channel product: ${error.message}`);
  }
}

export default getChannelProduct;