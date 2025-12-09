interface Platform {
  [key: string]: any;
  searchProductsFunction: string;
  getProductFunction: string;
  createPurchaseFunction: string;
  createWebhookFunction: string;
  deleteWebhookFunction: string;
  getWebhooksFunction: string;
  oAuthFunction: string;
  oAuthCallbackFunction: string;
  createTrackingWebhookHandler: string;
  cancelPurchaseWebhookHandler: string;
}

export async function executeChannelAdapterFunction({
  platform,
  functionName,
  args,
}: {
  platform: Platform;
  functionName: string;
  args: any;
}) {
  const functionPath = platform[functionName];

  if (functionPath.startsWith('http')) {
    const response = await fetch(functionPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, ...args }),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }

  const adapter = await import(
    `../../integrations/channel/${functionPath}.ts`
  );

  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`,
    );
  }

  try {
    return await fn({ platform, ...args });
  } catch (error: any) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${error.message}`,
    );
  }
}

// Helper functions for common channel operations
export async function searchChannelProducts({
  platform,
  searchEntry,
  after,
}: {
  platform: Platform;
  searchEntry: string;
  after?: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'searchProductsFunction',
    args: { searchEntry, after },
  });
}

export async function getChannelProduct({
  platform,
  productId,
  variantId,
}: {
  platform: Platform;
  productId: string;
  variantId?: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'getProductFunction',
    args: { productId, variantId },
  });
}

export async function createChannelPurchase({
  platform,
  cartItems,
  shipping,
  notes,
}: {
  platform: Platform;
  cartItems: any[];
  shipping: any;
  notes: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'createPurchaseFunction',
    args: { cartItems, shipping, notes },
  });
}

export async function createChannelWebhook({
  platform,
  endpoint,
  events,
}: {
  platform: Platform;
  endpoint: string;
  events: any[];
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'createWebhookFunction',
    args: { endpoint, events },
  });
}

export async function deleteChannelWebhook({
  platform,
  webhookId,
}: {
  platform: Platform;
  webhookId: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'deleteWebhookFunction',
    args: { webhookId },
  });
}

export async function getChannelWebhooks({ platform }: { platform: Platform }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'getWebhooksFunction',
    args: {},
  });
}

export async function handleChannelOAuth({
  platform,
  callbackUrl,
  state,
}: {
  platform: Platform;
  callbackUrl: string;
  state: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'oAuthFunction',
    args: { callbackUrl, state },
  });
}

export async function handleChannelOAuthCallback({
  platform,
  code,
  shop,
  state,
}: {
  platform: Platform;
  code: string;
  shop: string;
  state: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'oAuthCallbackFunction',
    args: { code, shop, state },
  });
}

export async function handleChannelTrackingWebhook({
  platform,
  event,
  headers,
}: {
  platform: Platform;
  event: any;
  headers: any;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'createTrackingWebhookHandler',
    args: { event, headers },
  });
}

export async function handleChannelCancelWebhook({
  platform,
  event,
  headers,
}: {
  platform: Platform;
  event: any;
  headers: any;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'cancelPurchaseWebhookHandler',
    args: { event, headers },
  });
}