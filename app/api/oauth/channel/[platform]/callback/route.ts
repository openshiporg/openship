import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleChannelOAuthCallback } from '@/features/integrations/channel/lib/executor';
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

    // We need the shop domain from OpenFront
    if (!shop) {
      return NextResponse.json({ error: 'Shop domain not provided' }, { status: 422 });
    }

    // Build the callback URL from the current request (same as virtual field logic)
    const baseUrl = await getBaseUrl();
    const correctCallbackUrl = `${baseUrl}/api/oauth/channel/${platform}/callback`;

    // Handle OAuth callback using the executor - just exchange the code for access token
    const accessToken = await handleChannelOAuthCallback({
      platform: channelPlatform,
      code,
      shop,
      state,
      appKey: channelPlatform.appKey,
      appSecret: channelPlatform.appSecret,
      redirectUri: correctCallbackUrl, // Use the corrected URL instead of virtual field
    });

    // Redirect to channels page with query params to show create channel dialog
    const redirectUrl = new URL(`${baseUrl}/dashboard/platform/channels`);
    redirectUrl.searchParams.set('showCreateChannel', 'true');
    redirectUrl.searchParams.set('platform', platform);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('domain', shop);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}