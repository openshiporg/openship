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

    console.log('🚀 CREATE ORDER WEBHOOK RECEIVED');
    console.log('📋 Shop ID:', shopId);
    console.log('📦 Webhook Body:', JSON.stringify(body, null, 2));
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('================================================');

    // Respond immediately to acknowledge receipt
    const response = NextResponse.json({ received: true });

    // Process webhook asynchronously
    processWebhook(shopId, body, headers);

    return response;
  } catch (error) {
    console.error('💥 WEBHOOK ENDPOINT ERROR:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhook(shopId: string, body: any, headers: any) {
  try {
    console.log('🔍 STEP 1: Finding shop in database...');
    
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
      console.error('❌ STEP 1 FAILED: Shop not found:', shopId);
      return;
    }

    console.log('✅ STEP 1 SUCCESS: Shop found');
    console.log('🏪 Shop Details:', {
      id: shop.id,
      domain: shop.domain,
      userId: shop.user.id,
      userEmail: shop.user.email,
      linksCount: shop.links.length,
      platformName: shop.platform.name,
      handler: shop.platform.createOrderWebhookHandler
    });

    console.log('🔧 STEP 2: Processing webhook with shop adapter...');

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

    console.log('✅ STEP 2 SUCCESS: Webhook processed by adapter');
    console.log('📝 Order Data from Adapter:', JSON.stringify(orderData, null, 2));

    console.log('🗄️ STEP 3: Creating order in database...');
    console.log('🧹 Data after removeEmpty:', JSON.stringify(removeEmpty({
      ...orderData,
      shop: { connect: { id: shop.id } },
      user: { connect: { id: shop.user.id } },
    }), null, 2));

    // Create the order in the database using removeEmpty (like Dasher)
    const order = await keystoneContext.sudo().query.Order.createOne({
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

    console.log('✅ STEP 3 SUCCESS: Order created in database');
    console.log('🎉 FINAL ORDER:', JSON.stringify(order, null, 2));
    console.log('🚀 WEBHOOK PROCESSING COMPLETE - SUCCESS!');
    console.log('================================================');

  } catch (error) {
    console.error('💥 WEBHOOK PROCESSING ERROR:', error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('================================================');
  }
}