async function getChannelWebhooks(root, { channelId }, context) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id getWebhooksFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!channel.platform.getWebhooksFunction) {
    throw new Error("Get webhooks function not configured.");
  }

  const { getWebhooksFunction } = channel.platform;

  if (getWebhooksFunction.startsWith("http")) {
    // External API call
    const response = await fetch(getWebhooksFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: channel.domain,
        accessToken: channel.accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    const { webhooks } = await response.json();
    return webhooks; // Assuming the response includes a 'webhooks' array
  } else {
    // Internal function call
    const channelAdapters = await import(
      `../../../../channelAdapters/${getWebhooksFunction}.js`
    );

    const result = await channelAdapters.getWebhooks({
      domain: channel.domain,
      accessToken: channel.accessToken,
    });

    return result.webhooks; // Ensure webhooks are returned in the expected format
  }
}

export default getChannelWebhooks;