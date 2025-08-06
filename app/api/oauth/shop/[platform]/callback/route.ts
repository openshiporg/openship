import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopOAuthCallback } from '@/features/integrations/shop/lib/executor';
import { getAuthHeaders } from '@/features/dashboard/actions/auth';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get all query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const { shop, code, state } = queryParams;

    // Get authenticated user from session
    const authHeaders = await getAuthHeaders();
    const userQuery = `
      query AuthenticatedUser {
        authenticatedItem {
          ... on User {
            id
            email
            name
          }
        }
      }
    `;

    const userResponse = await keystoneContext.sudo().withSession({ data: authHeaders }).graphql.run({
      query: userQuery,
    }) as any;

    const authenticatedUser = userResponse.authenticatedItem;

    if (!authenticatedUser) {
      const baseUrl = await getBaseUrl();
      return NextResponse.redirect(
        `${baseUrl}/signin?from=${encodeURIComponent(request.url)}`
      );
    }

    if (!platform) {
      return NextResponse.json({ error: 'Platform not specified' }, { status: 422 });
    }

    // Find the shop platform
    const shopPlatform = await keystoneContext.sudo().query.ShopPlatform.findOne({
      where: { id: platform },
      query: `
        id
        name
        appKey
        appSecret
        callbackUrl
        oAuthCallbackFunction
      `,
    });

    if (!shopPlatform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Handle OAuth callback using the executor
    const accessToken = await handleShopOAuthCallback({
      platform: shopPlatform,
      code,
      shop,
      state,
      appKey: shopPlatform.appKey,
      appSecret: shopPlatform.appSecret,
      redirectUri: shopPlatform.callbackUrl,
    });

    // Upsert shop
    await upsertShop({
      shopDomain: shop,
      accessToken,
      platformId: shopPlatform.id,
      userId: authenticatedUser.id,
    });

    const baseUrl = await getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/dashboard/platform/shops`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function upsertShop({ shopDomain, accessToken, platformId, userId }: { shopDomain: string; accessToken: string; platformId: string; userId: string }) {
  // Check if shop already exists
  const existingShops = await keystoneContext.sudo().query.Shop.findMany({
    where: { domain: { equals: shopDomain } },
    query: 'id platform { id }',
  });

  if (existingShops.length > 0) {
    // Update existing shop
    const existingShop = existingShops[0];
    await keystoneContext.sudo().query.Shop.updateOne({
      where: { id: existingShop.id },
      data: { accessToken },
      query: 'id',
    });
  } else {
    // Create new shop
    await keystoneContext.sudo().query.Shop.createOne({
      data: {
        name: shopDomain.split('.')[0].toUpperCase(),
        accessToken,
        domain: shopDomain,
        platform: { connect: { id: platformId } },
        user: { connect: { id: userId } },
      },
      query: 'id',
    });
  }
}