export async function executeChannelAdapterFunction({ platform, functionName, args }) {
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

// Helper functions for common channel operations
export async function searchChannelProducts({ platform, searchEntry, after }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after },
  });
}

export async function getChannelProduct({ platform, productId }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId },
  });
}

export async function createChannelPurchase({ platform, cartItems, shipping, notes }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createPurchaseFunction",
    args: { cartItems, shipping, notes },
  });
}

export async function createChannelWebhook({ platform, endpoint, events }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events },
  });
}

export async function deleteChannelWebhook({ platform, webhookId }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId },
  });
}

export async function getChannelWebhooks({ platform }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {},
  });
}

export async function handleChannelOAuth({ platform, callbackUrl }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl },
  });
}

export async function handleChannelOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri },
  });
}

export async function handleChannelTrackingWebhook({ platform, event, headers }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createTrackingWebhookHandler",
    args: { event, headers },
  });
}

export async function handleChannelCancelWebhook({ platform, event, headers }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "cancelPurchaseWebhookHandler",
    args: { event, headers },
  });
}