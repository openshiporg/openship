import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelCancelWebhook } from '@/features/integrations/channel/lib/executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    // Respond immediately to acknowledge receipt
    const response = NextResponse.json({ received: true });

    // Get the webhook payload
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    const { channelId } = await params;

    // Process webhook asynchronously
    processWebhook(channelId, body, headers);

    return response;
  } catch (error) {
    console.error('Error processing cancel purchase webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(channelId: string, body: any, headers: any) {
  try {
    // Find the channel and its platform
    const channel = await keystoneContext.sudo().query.Channel.findOne({
      where: { id: channelId },
      query: `
        id
        domain
        accessToken
        platform {
          id
          name
          cancelPurchaseWebhookHandler
          appKey
          appSecret
        }
      `,
    });

    if (!channel) {
      console.error(`Channel not found: ${channelId}`);
      return;
    }

    console.log('Processing cancel purchase webhook for channel:', channel.domain);

    // Use the channel provider adapter to handle the webhook
    const purchaseId = await handleChannelCancelWebhook({
      platform: {
        ...channel.platform,
        domain: channel.domain,
        accessToken: channel.accessToken,
      },
      event: body,
      headers,
    });

    console.log('Purchase ID to cancel:', purchaseId);

    // Find all cart items associated with this purchase
    const cartItems = await keystoneContext.sudo().query.CartItem.findMany({
      where: { purchaseId: { equals: purchaseId } },
      query: `
        id
        purchaseId
        title
        status
        order {
          id
          orderName
        }
      `,
    });

    if (cartItems.length === 0) {
      console.warn(`No cart items found for purchaseId: ${purchaseId}`);
      return;
    }

    // Update all cart items to cancelled status
    const updatePromises = cartItems.map(item =>
      keystoneContext.sudo().query.CartItem.updateOne({
        where: { id: item.id },
        data: { status: 'CANCELLED' },
        query: 'id status title purchaseId',
      })
    );

    const updatedCartItems = await Promise.all(updatePromises);

    console.log('Cart items cancelled successfully:', updatedCartItems);

    // Check if all cart items in the order are now cancelled
    // If so, we might want to update the order status as well
    const orderIds = [...new Set(cartItems.map(item => item.order.id))];
    
    for (const orderId of orderIds) {
      const allCartItemsInOrder = await keystoneContext.sudo().query.CartItem.findMany({
        where: { order: { id: { equals: orderId } } },
        query: 'id status',
      });

      const allCancelled = allCartItemsInOrder.every(item => item.status === 'CANCELLED');
      
      if (allCancelled) {
        await keystoneContext.sudo().query.Order.updateOne({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
          query: 'id status orderName',
        });
        console.log(`Order ${orderId} marked as cancelled`);
      }
    }
  } catch (error) {
    console.error('Error processing cancel purchase webhook:', error);
  }
}