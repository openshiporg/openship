import { getChannelWebhooks as executeGetChannelWebhooks } from "../../utils/channelProviderAdapter";

interface GetChannelWebhooksArgs {
  channelId: string;
}

async function getChannelWebhooks(
  root: any,
  { channelId }: GetChannelWebhooksArgs,
  context: any
) {
  try {
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

    const result = await executeGetChannelWebhooks({
      platform: channel.platform,
    });

    return result.webhooks;
  } catch (error: any) {
    throw new Error(`Error getting channel webhooks: ${error.message}`);
  }
}

export default getChannelWebhooks;