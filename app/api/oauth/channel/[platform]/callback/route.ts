import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelOAuthCallback } from '@/features/integrations/channel/lib/executor';
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

    const userResponse = await keystoneContext.withRequest(request, { headers: authHeaders }).graphql.run({
      query: userQuery,
    });

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

    // Find the channel platform
    const channelPlatform = await keystoneContext.sudo().query.ChannelPlatform.findOne({
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

    if (!channelPlatform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }

    // Handle OAuth callback using the executor
    const accessToken = await handleChannelOAuthCallback({
      platform: channelPlatform,
      code,
      shop,
      state,
      appKey: channelPlatform.appKey,
      appSecret: channelPlatform.appSecret,
      redirectUri: channelPlatform.callbackUrl,
    });

    // Upsert channel
    await upsertChannel({
      channelDomain: shop,
      accessToken,
      platformId: channelPlatform.id,
      userId: authenticatedUser.id,
    });

    const baseUrl = await getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/dashboard/platform/channels`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error.message },
      { status: 500 }
    );
  }
}

async function upsertChannel({ channelDomain, accessToken, platformId, userId }) {
  // Check if channel already exists
  const existingChannels = await keystoneContext.sudo().query.Channel.findMany({
    where: { domain: { equals: channelDomain } },
    query: 'id platform { id }',
  });

  if (existingChannels.length > 0) {
    // Update existing channel
    const existingChannel = existingChannels[0];
    await keystoneContext.sudo().query.Channel.updateOne({
      where: { id: existingChannel.id },
      data: { accessToken },
      query: 'id',
    });
  } else {
    // Create new channel
    await keystoneContext.sudo().query.Channel.createOne({
      data: {
        name: channelDomain.split('.')[0].toUpperCase(),
        accessToken,
        domain: channelDomain,
        platform: { connect: { id: platformId } },
        user: { connect: { id: userId } },
      },
      query: 'id',
    });
  }
}