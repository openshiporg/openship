async function createChannelWebhook(root, { channelId, topic, endpoint }, context) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id createWebhookFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Channel platform not configured.");
  }

  if (!channel.platform.createWebhookFunction) {
    throw new Error("Create webhook function not configured.");
  }

  const { createWebhookFunction } = channel.platform;

  if (createWebhookFunction.startsWith("http")) {
    // External API call
    const response = await fetch(createWebhookFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: channel.domain,
        accessToken: channel.accessToken,
        topic,
        endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create webhook: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } else {
    // Internal function call
    const channelAdapters = await import(
      `../../../../channelAdapters/${createWebhookFunction}.js`
    );

    const result = await channelAdapters.createWebhook({
      domain: channel.domain,
      accessToken: channel.accessToken,
      topic,
      endpoint,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, webhookId: result.webhookId };
  }
}

export default createChannelWebhook;