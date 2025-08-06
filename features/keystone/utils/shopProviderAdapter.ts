export async function executeShopAdapterFunction({ platform, functionName, args }: any) {
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
    
    const result = await response.json();
    return result;
  }

  const adapter = await import(
    `../../integrations/shop/${functionPath}.ts`
  );

  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }

  try {
    const result = await fn({ platform, ...args });
    return result;
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${(error as any)?.message || 'Unknown error'}`
    );
  }
}

// Helper functions for common shop operations
export async function searchShopProducts({ platform, searchEntry, after }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after },
  });
}

export async function getShopProduct({ platform, productId, variantId }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId, variantId },
  });
}

export async function searchShopOrders({ platform, searchEntry, after }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchOrdersFunction",
    args: { searchEntry, after },
  });
}

export async function updateShopProduct({ platform, productId, variantId, inventory, price }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "updateProductFunction",
    args: { productId, variantId, inventory, price },
  });
}

export async function addCartToPlatformOrder({ platform, cartItems, orderId }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addCartToPlatformOrderFunction",
    args: { cartItems, orderId },
  });
}

export async function createShopWebhook({ platform, endpoint, events }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events },
  });
}

export async function deleteShopWebhook({ platform, webhookId }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId },
  });
}

export async function getShopWebhooks({ platform }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {},
  });
}

export async function handleShopOAuth({ platform, callbackUrl }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl },
  });
}

export async function handleShopOAuthCallback({ platform, code, shop, state }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state },
  });
}

export async function handleShopOrderWebhook({ platform, event, headers }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createOrderWebhookHandler",
    args: { event, headers },
  });
}

export async function handleShopCancelWebhook({ platform, event, headers }: any) {
  return executeShopAdapterFunction({
    platform,
    functionName: "cancelOrderWebhookHandler",
    args: { event, headers },
  });
}