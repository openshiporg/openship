import { createChannelPurchase as executeChannelPurchase } from "../../utils/channelProviderAdapter";

async function createChannelPurchase(root: any, { input }: { input: any }, context: any) {
  const { channelId, cartItems, address, notes, ...otherData } = input;

  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id createPurchaseFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Channel platform not configured.");
  }

  try {
    const result = await executeChannelPurchase({
      platform: channel.platform,
      cartItems,
      shipping: address,
      notes,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, purchaseId: result.purchaseId };
  } catch (error: any) {
    throw new Error(`Failed to create purchase: ${error.message}`);
  }
}

export default createChannelPurchase;