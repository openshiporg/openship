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


    // Respond immediately to acknowledge receipt
    const response = NextResponse.json({ received: true });

    // Process webhook asynchronously
    processWebhook(shopId, body, headers);

    return response;
  } catch (error) {
    console.error('WEBHOOK ENDPOINT ERROR:', error);
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

    if (!shop) {
      console.error('Shop not found:', shopId);
      return;
    }

    // Use the shop provider adapter to handle the webhook
    const orderData = await handleShopOrderWebhook({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken,
      },
      event: body,
      headers,
    });

    // Create the order in the database using removeEmpty (like Dasher)
    await keystoneContext.sudo().query.Order.createOne({
      data: removeEmpty({
        ...orderData,
        shop: { connect: { id: shop.id } },
        user: { connect: { id: shop.user.id } },
      }),
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
    console.error('WEBHOOK PROCESSING ERROR:', error instanceof Error ? error.message : 'Unknown error');
  }
}