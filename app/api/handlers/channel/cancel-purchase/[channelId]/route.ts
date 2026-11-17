import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelCancelWebhook } from '@/features/integrations/channel/lib/executor';

function errorStatus(message: string): number {
  if (/missing webhook|invalid webhook|hmac|signature/i.test(message)) return 401;
  if (/channel not found/i.test(message)) return 404;
  if (/missing purchase|no cart items/i.test(message)) return 400;
  return 500;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const headers = Object.fromEntries(request.headers.entries());
    const { channelId } = await params;
    await processWebhook(channelId, body, headers, rawBody);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    console.error('Error processing cancel purchase webhook:', error);
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

async function processWebhook(channelId: string, body: unknown, headers: Record<string, string>, rawBody: string) {
  const sudo = keystoneContext.sudo();
  const channel = await sudo.query.Channel.findOne({
    where: { id: channelId },
    query: `
      id
      domain
      accessToken
      metadata
      webhookSecret
      platform {
        id
        name
        cancelPurchaseWebhookHandler
        appKey
        appSecret
        webhookSecret
      }
    `,
  });
  if (!channel) throw new Error(`Channel not found: ${channelId}`);

  const result = await handleChannelCancelWebhook({
    platform: {
      ...channel.platform,
      ...(channel.metadata || {}),
      webhookSecret: channel.webhookSecret || channel.platform?.webhookSecret,
      resourceId: channel.id,
      domain: channel.domain,
      accessToken: channel.accessToken,
    },
    event: body,
    headers,
    rawBody,
  });
  const purchaseId = String(
    result?.purchaseId || result?.order?.id || (typeof result === 'string' ? result : '')
  ).trim();
  if (!purchaseId) throw new Error('Cancellation webhook is missing purchaseId');

  const cartItems = await sudo.query.CartItem.findMany({
    where: {
      purchaseId: { equals: purchaseId },
      channel: { id: { equals: channelId } },
    },
    query: 'id status order { id }',
  });
  if (cartItems.length === 0) {
    throw new Error(`No cart items found for purchaseId: ${purchaseId}`);
  }

  await Promise.all(
    cartItems
      .filter((item: any) => item.status !== 'CANCELLED')
      .map((item: any) => sudo.query.CartItem.updateOne({
        where: { id: item.id },
        data: { status: 'CANCELLED' },
        query: 'id',
      }))
  );

  const orderIds = [...new Set(cartItems.map((item: any) => item.order?.id).filter(Boolean))];
  for (const orderId of orderIds) {
    const remaining = await sudo.query.CartItem.findMany({
      where: { order: { id: { equals: String(orderId) } } },
      query: 'id status',
    });
    if (remaining.length > 0 && remaining.every((item: any) => item.status === 'CANCELLED')) {
      await sudo.query.Order.updateOne({
        where: { id: String(orderId) },
        data: { status: 'CANCELLED' },
        query: 'id',
      });
    }
  }
}
