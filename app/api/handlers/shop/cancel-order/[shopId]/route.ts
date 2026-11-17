import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopCancelWebhook } from '@/features/integrations/shop/lib/executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    // Get the webhook payload
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const headers = Object.fromEntries(request.headers.entries());
    const { shopId } = await params;

    await processWebhook(shopId, body, headers, rawBody);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing cancel order webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(shopId: string, body: any, headers: any, rawBody: string) {
    // Find the shop and its platform
    const shop = await keystoneContext.sudo().query.Shop.findOne({
      where: { id: shopId },
      query: `
        id
        domain
        accessToken
        metadata
        webhookSecret
        platform {
          id
          name
          cancelOrderWebhookHandler
          appKey
          appSecret
        }
      `,
    });

    if (!shop) throw new Error(`Shop not found: ${shopId}`);

    // Use the shop provider adapter to handle the webhook
    const cancelled = await handleShopCancelWebhook({
      platform: {
        ...shop.platform,
        ...(shop.metadata || {}),
        webhookSecret: shop.webhookSecret,
        resourceId: shop.id,
        domain: shop.domain,
        accessToken: shop.accessToken,
      },
      event: body,
      headers,
      rawBody,
    });

    // OpenFront returns the order ID; Shopify returns { order, type }.
    const orderId = String(
      typeof cancelled === 'string' ? cancelled : cancelled?.order?.id ?? ''
    ).trim();
    if (!orderId) throw new Error('Cancellation webhook is missing the order ID');

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

      // Stop supplier purchases that have not started yet. Items already
      // bought or mid-purchase keep their status for the operator.
      const unplaced = await keystoneContext.sudo().query.CartItem.findMany({
        where: {
          order: { id: { equals: foundOrder.id } },
          purchaseId: { equals: '' },
          url: { equals: '' },
          purchaseAttemptKey: { equals: null },
          status: { not: { equals: 'CANCELLED' } },
        },
        query: 'id',
      });
      if (unplaced.length) {
        await keystoneContext.sudo().query.CartItem.updateMany({
          data: unplaced.map((item) => ({
            where: { id: item.id },
            data: { status: 'CANCELLED' },
          })),
        });
      }

      return updatedOrder;
    }
    throw new Error(`Order not found for orderId: ${orderId} in shop: ${shopId}`);
}