async function createChannelPurchase(root, { input }, context) {
  // Assuming 'input' contains channelId instead of shopId
  const { channelId, ...purchaseData } = input;

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

  if (!channel.platform.createPurchaseFunction) {
    throw new Error("Create purchase function not configured.");
  }

  const { createPurchaseFunction } = channel.platform;

  if (createPurchaseFunction.startsWith("http")) {
    // External API call
    const params = new URLSearchParams({
      domain: channel.domain,
      accessToken: channel.accessToken,
      ...purchaseData,
    }).toString();

    const response = await fetch(`${createPurchaseFunction}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to create purchase: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } else {
    // Internal function call
    const channelFunctions = await import(
      `../../../../channelFunctions/${createPurchaseFunction}.js`
    );

    const result = await channelFunctions.createPurchase({
      domain: channel.domain,
      accessToken: channel.accessToken,
      ...purchaseData,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, purchaseId: result.purchaseId };
  }
}

export default createChannelPurchase;
