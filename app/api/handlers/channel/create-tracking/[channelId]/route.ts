import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelTrackingWebhook } from '@/features/integrations/channel/lib/executor';
import { relaySourceTrackingForDetail } from '@/features/integrations/channel/tracking-relay';
import {
  supplierCartItemAllocations,
  trackingDedupeKey,
} from '@/features/integrations/channel/tracking-webhook';

type WebhookResult = { success: boolean; error?: string; status?: number };

function errorStatus(message: string): number {
  if (/missing webhook signature|invalid webhook signature/i.test(message)) return 401;
  if (/channel not found/i.test(message)) return 404;
  if (/missing purchaseId|missing tracking|unknown supplier line|exactly one source order/i.test(message)) {
    return 400;
  }
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
    const result = await processWebhook(channelId, body, headers, rawBody);

    if (result.success) {
      return NextResponse.json({ received: true });
    }
    return NextResponse.json(
      { error: result.error || 'Webhook processing failed' },
      { status: result.status || 500 }
    );
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}

// Suppliers such as Shopify report fulfilled lines by variant, not by our cart
// item. Map a line only when its variant is on exactly one cart item.
function allocationsByVariant(
  lineItems: unknown,
  cartItems: ReadonlyArray<Record<string, any>>
): Array<{ cartItemId: string; quantity: number }> {
  if (!Array.isArray(lineItems)) return [];
  const allocations = new Map<string, number>();
  for (const line of lineItems as any[]) {
    const variantId = String(line?.variantId ?? '').trim();
    const quantity = Number(line?.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity <= 0) return [];
    const matches = cartItems.filter((item) => String(item.variantId || '') === variantId);
    if (matches.length !== 1) return [];
    allocations.set(matches[0].id, (allocations.get(matches[0].id) || 0) + quantity);
  }
  return [...allocations].map(([cartItemId, quantity]) => ({ cartItemId, quantity }));
}

async function processWebhook(
  channelId: string,
  body: unknown,
  headers: Record<string, string>,
  rawBody: string
): Promise<WebhookResult> {
  try {
    const sudo = keystoneContext.sudo();
    const channel = await sudo.query.Channel.findOne({
      where: { id: channelId },
      query: `
        id
        domain
        accessToken
        metadata
        webhookSecret
        user { id }
        platform {
          id
          name
          createTrackingWebhookHandler
          appKey
          appSecret
          webhookSecret
        }
      `,
    });
    if (!channel) {
      return { success: false, error: `Channel not found: ${channelId}`, status: 404 };
    }

    const trackingData = await handleChannelTrackingWebhook({
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

    const fulfillmentData = trackingData.fulfillment || trackingData;
    const purchaseId = String(fulfillmentData.purchaseId || '').trim();
    const trackingNumber = String(fulfillmentData.trackingNumber || '').trim();
    const trackingCompany = String(fulfillmentData.trackingCompany || '').trim();
    if (!purchaseId || !trackingNumber || !trackingCompany) {
      return {
        success: false,
        error: 'Tracking webhook is missing purchaseId, trackingNumber, or trackingCompany',
        status: 400,
      };
    }

    const fulfillmentId = String(fulfillmentData.id || '').trim();
    const dedupeKey = trackingDedupeKey(
      channelId,
      purchaseId,
      trackingNumber,
      fulfillmentId || undefined
    );
    const existingTracking = await sudo.query.TrackingDetail.findMany({
      where: fulfillmentId
        ? { dedupeKey: { equals: dedupeKey } }
        : {
            OR: [
              { dedupeKey: { equals: dedupeKey } },
              {
                AND: [
                  { purchaseId: { equals: purchaseId } },
                  { trackingNumber: { equals: trackingNumber } },
                  {
                    cartItems: {
                      some: { channel: { id: { equals: channelId } } },
                    },
                  },
                ],
              },
            ],
          },
      take: 1,
      query: 'id dedupeKey',
    });

    if (existingTracking.length > 0) {
      if (!existingTracking[0].dedupeKey) {
        await sudo.query.TrackingDetail.updateOne({
          where: { id: existingTracking[0].id },
          data: { dedupeKey },
          query: 'id',
        });
      }
      await relaySourceTrackingForDetail(keystoneContext, existingTracking[0].id);
      return { success: true };
    }

    const purchaseCartItems = await sudo.query.CartItem.findMany({
      where: {
        purchaseId: { equals: purchaseId },
        channel: { id: { equals: channelId } },
      },
      query: `
        id
        purchaseId
        quantity
        lineItemId
        variantId
        channel { id }
        order { id orderName }
      `,
    });
    if (purchaseCartItems.length === 0) {
      return {
        success: false,
        error: `No cart items found for purchaseId: ${purchaseId}`,
        status: 400,
      };
    }

    let allocations = supplierCartItemAllocations(fulfillmentData.lineItems);
    if (allocations.length === 0) {
      allocations = allocationsByVariant(fulfillmentData.lineItems, purchaseCartItems);
    }
    const mappedCartItemIds = allocations.map((allocation) => allocation.cartItemId);
    let cartItems = purchaseCartItems;
    if (mappedCartItemIds.length > 0) {
      const expected = new Set(mappedCartItemIds);
      cartItems = purchaseCartItems.filter((item: any) => expected.has(item.id));
      if (cartItems.length !== expected.size) {
        return {
          success: false,
          error: 'Tracking webhook contains unknown supplier line items',
          status: 400,
        };
      }
      for (const allocation of allocations) {
        const cartItem = cartItems.find((item: any) => item.id === allocation.cartItemId);
        if (!cartItem || allocation.quantity > Number(cartItem.quantity || 0)) {
          return {
            success: false,
            error: `Supplier fulfillment exceeds cart item quantity for ${allocation.cartItemId}`,
            status: 400,
          };
        }
      }
    } else if (purchaseCartItems.length > 1) {
      return {
        success: false,
        error: 'Tracking webhook does not identify cart items for a multi-line purchase',
        status: 400,
      };
    }

    const sourceOrderIds = new Set(
      cartItems.map((item: any) => item.order?.id).filter(Boolean)
    );
    if (sourceOrderIds.size !== 1) {
      return {
        success: false,
        error: 'Tracking purchase must map to exactly one source order',
        status: 400,
      };
    }

    try {
      await sudo.query.TrackingDetail.createOne({
        data: {
          trackingNumber,
          trackingCompany,
          purchaseId,
          dedupeKey,
          fulfillmentLineItems: allocations.length
            ? allocations
            : cartItems.map((item: any) => ({
                cartItemId: item.id,
                quantity: Number(item.quantity),
              })),
          cartItems: { connect: cartItems.map((item: any) => ({ id: item.id })) },
        },
        query: 'id',
      });
    } catch (error) {
      const winner = await sudo.query.TrackingDetail.findMany({
        where: { dedupeKey: { equals: dedupeKey } },
        take: 1,
        query: 'id',
      });
      if (winner.length === 0) throw error;
      await relaySourceTrackingForDetail(keystoneContext, winner[0].id);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message, status: errorStatus(message) };
  }
}
