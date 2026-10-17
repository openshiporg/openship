import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopOrderWebhook } from '@/features/integrations/shop/lib/executor';

// Helper function to remove empty values (matching Dasher's removeEmpty)
function removeEmpty(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    // Get the webhook payload
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    const { shopId } = await params;

    await processWebhook(shopId, body, headers);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('WEBHOOK ENDPOINT ERROR:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(shopId: string, body: any, headers: any) {
    // Find the shop and its platform
    const shop = await keystoneContext.sudo().query.Shop.findOne({
      where: { id: shopId },
      query: `
        id
        domain
        accessToken
        metadata
        webhookSecret
        user {
          id
          email
        }
        links {
          channel {
            id
            name
          }
        }
        platform {
          id
          name
          createOrderWebhookHandler
          appKey
          appSecret
        }
      `,
    });

    if (!shop) throw new Error(`Shop not found: ${shopId}`);

    // Use the shop provider adapter to handle the webhook

    const orderData = await handleShopOrderWebhook({
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
    });

    // Build the Keystone input only after signature verification succeeds.
    const finalOrderData = removeEmpty({
      ...orderData,
      shop: { connect: { id: shop.id } },
      user: { connect: { id: shop.user.id } },
    });

    // OpenFront delivery is at-least-once. The unique source order ID is the
    // durable idempotency boundary; replays acknowledge the canonical row.
    const existingOrder = await keystoneContext.sudo().query.Order.findMany({
      where: {
        orderId: { equals: finalOrderData.orderId },
        shop: { id: { equals: shop.id } },
      },
      take: 1,
      query: 'id orderId',
    });
    if (existingOrder[0]) return existingOrder[0];

    let createdOrder;
    try {
      createdOrder = await keystoneContext.sudo().query.Order.createOne({
        data: finalOrderData,
        query: `
        id
        orderId
        orderName
        email
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        state
        zip
        phone
        totalPrice
        subTotalPrice
        totalDiscounts
        totalTax
        status
        linkOrder
        matchOrder
        processOrder
        lineItems {
          id
          name
          image
          price
          quantity
          productId
          variantId
          sku
          lineItemId
        }
        shop {
          id
          domain
          links {
            channel {
              id
              name
            }
          }
        }
        `,
      });
    } catch (error) {
      const winner = await keystoneContext.sudo().query.Order.findMany({
        where: {
          orderId: { equals: finalOrderData.orderId },
          shop: { id: { equals: shop.id } },
        },
        take: 1,
        query: 'id orderId',
      });
      if (!winner[0]) throw error;
      // Usually a duplicate delivery that lost the race; log it so other failures stay visible.
      console.warn(`Order ${finalOrderData.orderId} already exists after a create error:`, error instanceof Error ? error.message : error);
      createdOrder = winner[0];
    }

    return createdOrder;
}