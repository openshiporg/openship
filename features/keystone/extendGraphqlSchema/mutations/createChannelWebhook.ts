import { createChannelWebhook as executeCreateChannelWebhook } from "../../utils/channelProviderAdapter";

interface CreateChannelWebhookArgs {
  channelId: string;
  topic: string;
  endpoint: string;
}

async function createChannelWebhook(
  root: any,
  { channelId, topic, endpoint }: CreateChannelWebhookArgs,
  context: any
) {
  try {
    const sudoContext = context.sudo();

    // Fetch the channel using the provided channelId
    const channel = await sudoContext.query.Channel.findOne({
      where: { id: channelId },
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

    if (!channel) {
      return { success: false, error: "Channel not found" };
    }

    if (!channel.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }

    if (!channel.platform.createWebhookFunction) {
      return { success: false, error: "Create webhook function not configured." };
    }

    // Prepare platform configuration (matching working pattern)
    const platformConfig = {
      domain: channel.domain,
      accessToken: channel.accessToken,
      createWebhookFunction: channel.platform.createWebhookFunction,
      ...channel.metadata,
    };

    const result = await executeCreateChannelWebhook({
      platform: platformConfig,
      endpoint,
      events: [topic],
    });

    return { success: true, webhookId: result.webhookId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default createChannelWebhook;