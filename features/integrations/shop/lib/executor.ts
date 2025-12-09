export async function executeShopAdapterFunction({ platform, functionName, args }: { platform: any; functionName: string; args: any }) {
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

// Helper functions for common shop operations
export async function searchShopProducts({ platform, searchEntry, after }: { platform: any; searchEntry: string; after?: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after },
  });
}

export async function getShopProduct({ platform, productId }: { platform: any; productId: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId },
  });
}

export async function searchShopOrders({ platform, searchEntry, after }: { platform: any; searchEntry: string; after?: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchOrdersFunction",
    args: { searchEntry, after },
  });
}

export async function updateShopProduct({ platform, productId, inventory, price }: { platform: any; productId: string; inventory?: number; price?: number }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "updateProductFunction",
    args: { productId, inventory, price },
  });
}

export async function addCartToPlatformOrder({ platform, cartItems, orderId }: { platform: any; cartItems: any; orderId: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addCartToPlatformOrderFunction",
    args: { cartItems, orderId },
  });
}

export async function createShopWebhook({ platform, endpoint, events }: { platform: any; endpoint: string; events: string[] }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events },
  });
}

export async function deleteShopWebhook({ platform, webhookId }: { platform: any; webhookId: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId },
  });
}

export async function getShopWebhooks({ platform }: { platform: any }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {},
  });
}

export async function handleShopOAuth({ platform, callbackUrl, state }: { platform: any; callbackUrl: string; state: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl, state },
  });
}

export async function handleShopOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }: { platform: any; code?: string; shop?: string; state?: string; appKey?: string; appSecret?: string; redirectUri?: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri },
  });
}

export async function handleShopOrderWebhook({ platform, event, headers }: { platform: any; event: any; headers: any }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createOrderWebhookHandler",
    args: { event, headers },
  });
}

export async function handleShopCancelWebhook({ platform, event, headers }: { platform: any; event: any; headers: any }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "cancelOrderWebhookHandler",
    args: { event, headers },
  });
}

export async function addShopTracking({ platform, order, trackingCompany, trackingNumber }: { platform: any; order: any; trackingCompany: string; trackingNumber: string }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addTrackingFunction",
    args: { order, trackingCompany, trackingNumber },
  });
}