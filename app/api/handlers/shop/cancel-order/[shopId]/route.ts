import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopCancelWebhook } from '@/features/integrations/shop/lib/executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    // Respond immediately to acknowledge receipt
    const response = NextResponse.json({ received: true });

    // Get the webhook payload
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    const { shopId } = await params;

    // Process webhook asynchronously
    processWebhook(shopId, body, headers);

    return response;
  } catch (error) {
    console.error('Error processing cancel order webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(shopId: string, body: any, headers: any) {
  try {
    // Find the shop and its platform
    const shop = await keystoneContext.sudo().query.Shop.findOne({
      where: { id: shopId },
      query: `
        id
        domain
        accessToken
        platform {
          id
          name
          cancelOrderWebhookHandler
          appKey
          appSecret
        }
      `,
    });

    if (!shop) {
      console.error(`Shop not found: ${shopId}`);
      return;
    }

    console.log('Processing cancel webhook for shop:', shop.domain);

    // Use the shop provider adapter to handle the webhook
    const orderId = await handleShopCancelWebhook({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken,
      },
      event: body,
      headers,
    });

    console.log('Order ID to cancel:', orderId);

    // Find the order in our database
    const [foundOrder] = await keystoneContext.sudo().query.Order.findMany({
      where: {
        orderId: { equals: orderId },
        shop: { id: { equals: shopId } },
      },
      query: 'id status orderId orderName',
    });

    if (foundOrder) {
      // Update the order status to cancelled
      const updatedOrder = await keystoneContext.sudo().query.Order.updateOne({
        where: { id: foundOrder.id },
        data: { status: 'CANCELLED' },
        query: 'id status orderId orderName',
      });

      console.log('Order cancelled successfully:', updatedOrder);
    } else {
      console.warn(`Order not found for orderId: ${orderId} in shop: ${shopId}`);
    }
  } catch (error) {
    console.error('Error processing cancel webhook:', error);
  }
}