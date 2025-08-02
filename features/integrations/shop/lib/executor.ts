export async function executeShopAdapterFunction({ platform, functionName, args }) {
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
      `Error executing ${functionName} for platform ${functionPath}: ${error.message}`
    );
  }
}

// Helper functions for common shop operations
export async function searchShopProducts({ platform, searchEntry, after }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after },
  });
}

export async function getShopProduct({ platform, productId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId },
  });
}

export async function searchShopOrders({ platform, searchEntry, after }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchOrdersFunction",
    args: { searchEntry, after },
  });
}

export async function updateShopProduct({ platform, productId, inventory, price }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "updateProductFunction",
    args: { productId, inventory, price },
  });
}

export async function addCartToPlatformOrder({ platform, cartItems, orderId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addCartToPlatformOrderFunction",
    args: { cartItems, orderId },
  });
}

export async function createShopWebhook({ platform, endpoint, events }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events },
  });
}

export async function deleteShopWebhook({ platform, webhookId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId },
  });
}

export async function getShopWebhooks({ platform }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {},
  });
}

export async function handleShopOAuth({ platform, callbackUrl }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl },
  });
}

export async function handleShopOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri },
  });
}

export async function handleShopOrderWebhook({ platform, event, headers }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createOrderWebhookHandler",
    args: { event, headers },
  });
}

export async function handleShopCancelWebhook({ platform, event, headers }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "cancelOrderWebhookHandler",
    args: { event, headers },
  });
}

export async function addShopTracking({ platform, order, trackingCompany, trackingNumber }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addTrackingFunction",
    args: { order, trackingCompany, trackingNumber },
  });
}