export async function executeChannelAdapterFunction({ platform, functionName, args }: { platform: any; functionName: string; args: any }) {
  const functionPath = platform[functionName];

  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, ...args }),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }

  const adapter = await import(
    `../${functionPath}.ts`
  );

  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }

  try {
    return await fn({ platform, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${(error as Error).message}`
    );
  }
}

// Helper functions for common channel operations
export async function searchChannelProducts({ platform, searchEntry, after }: { platform: any; searchEntry: string; after?: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after },
  });
}

export async function getChannelProduct({ platform, productId }: { platform: any; productId: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId },
  });
}

export async function createChannelPurchase({ platform, cartItems, shipping, notes }: { platform: any; cartItems: any; shipping: any; notes?: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createPurchaseFunction",
    args: { cartItems, shipping, notes },
  });
}

export async function createChannelWebhook({ platform, endpoint, events }: { platform: any; endpoint: string; events: string[] }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events },
  });
}

export async function deleteChannelWebhook({ platform, webhookId }: { platform: any; webhookId: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId },
  });
}

export async function getChannelWebhooks({ platform }: { platform: any }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {},
  });
}

export async function handleChannelOAuth({ platform, callbackUrl }: { platform: any; callbackUrl: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl },
  });
}

export async function handleChannelOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }: { platform: any; code?: string; shop?: string; state?: string; appKey?: string; appSecret?: string; redirectUri?: string }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri },
  });
}

export async function handleChannelTrackingWebhook({ platform, event, headers }: { platform: any; event: any; headers: any }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createTrackingWebhookHandler",
    args: { event, headers },
  });
}

export async function handleChannelCancelWebhook({ platform, event, headers }: { platform: any; event: any; headers: any }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "cancelPurchaseWebhookHandler",
    args: { event, headers },
  });
}