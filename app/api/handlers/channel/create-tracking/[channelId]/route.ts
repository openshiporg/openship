import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelTrackingWebhook } from '@/features/integrations/channel/lib/executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    // Get the webhook payload
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    const { channelId } = await params;


    // Process webhook synchronously to catch errors
    const result = await processWebhook(channelId, body, headers);
    
    if (result.success) {
      return NextResponse.json({ received: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(channelId: string, body: any, headers: any): Promise<{success: boolean, error?: string}> {
  try {

    // Find the channel and its platform
    const channel = await keystoneContext.sudo().query.Channel.findOne({
      where: { id: channelId },
      query: `
        id
        domain
        accessToken
        user {
          id
          email
        }
        platform {
          id
          name
          createTrackingWebhookHandler
          appKey
          appSecret
        }
      `,
    });

    if (!channel) {
      return { success: false, error: `Channel not found: ${channelId}` };
    }


    const trackingData = await handleChannelTrackingWebhook({
      platform: {
        ...channel.platform,
        domain: channel.domain,
        accessToken: channel.accessToken,
      },
      event: body,
      headers,
    });

    const { purchaseId, trackingNumber, trackingCompany } = trackingData.fulfillment || trackingData;
    
    const cartItems = await keystoneContext.sudo().query.CartItem.findMany({
      where: { purchaseId: { equals: purchaseId } },
      query: `
        id
        purchaseId
        quantity
        price
        productId
        variantId
        name
        image
        order {
          id
          orderName
        }
      `,
    });


    if (cartItems.length === 0) {
      return { success: false, error: `No cart items found for purchaseId: ${purchaseId}` };
    }
    
    const trackingDetail = await keystoneContext.sudo().query.TrackingDetail.createOne({
      data: {
        trackingNumber,
        trackingCompany,
        purchaseId,
        cartItems: {
          connect: cartItems.map(item => ({ id: item.id })),
        },
      },
      query: `
        id
        trackingNumber
        trackingCompany
        cartItems {
          id
          name
          order {
            id
            orderName
          }
        }
      `,
    });

    
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}