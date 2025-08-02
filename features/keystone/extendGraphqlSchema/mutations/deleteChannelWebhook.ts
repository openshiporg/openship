import { deleteChannelWebhook as executeDeleteChannelWebhook } from "../../utils/channelProviderAdapter";

interface DeleteChannelWebhookArgs {
  channelId: string;
  webhookId: string;
}

async function deleteChannelWebhook(
  root: any,
  { channelId, webhookId }: DeleteChannelWebhookArgs,
  context: any
) {
  try {
    // Fetch the channel using the provided channelId
    const channel = await context.query.Channel.findOne({
      where: { id: channelId },
      query: "id domain accessToken platform { id deleteWebhookFunction }",
    });

    if (!channel) {
      return { success: false, error: "Channel not found" };
    }

    if (!channel.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }

    await executeDeleteChannelWebhook({
      platform: {
        ...channel.platform,
        domain: channel.domain,
        accessToken: channel.accessToken,
      },
      webhookId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default deleteChannelWebhook;