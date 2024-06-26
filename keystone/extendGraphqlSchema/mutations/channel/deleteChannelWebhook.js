async function deleteChannelWebhook(root, { channelId, webhookId }, context) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id deleteWebhookFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Channel platform not configured.");
  }

  if (!channel.platform.deleteWebhookFunction) {
    throw new Error("Delete webhook function not configured.");
  }

  const { deleteWebhookFunction } = channel.platform;

  if (deleteWebhookFunction.startsWith("http")) {
    // External API call
    const params = new URLSearchParams({
      domain: channel.domain,
      accessToken: channel.accessToken,
      webhookId,
    }).toString();

    const response = await fetch(`${deleteWebhookFunction}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } else {
    // Internal function call
    const channelAdapters = await import(
      `../../../../channelAdapters/${deleteWebhookFunction}.js`
    );

    const result = await channelAdapters.deleteWebhook({
      domain: channel.domain,
      accessToken: channel.accessToken,
      webhookId,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true };
  }
}

export default deleteChannelWebhook;