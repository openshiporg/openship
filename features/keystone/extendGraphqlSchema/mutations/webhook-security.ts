import crypto from "node:crypto";

export type WebhookResourceKind = "shop" | "channel";

export function webhookRegistrationKey(
  kind: WebhookResourceKind,
  resourceId: string,
  topic: string
): string {
  return `openship:${kind}:${resourceId}:${topic.trim().toUpperCase()}`;
}

const ALLOWED_TOPICS: Record<WebhookResourceKind, ReadonlySet<string>> = {
  shop: new Set(["ORDER_CREATED", "ORDER_CANCELLED", "ORDER_CHARGEBACKED"]),
  channel: new Set(["TRACKING_CREATED", "ORDER_CANCELLED"]),
};

export function expectedWebhookPath(kind: WebhookResourceKind, resourceId: string, topic: string): string {
  if (kind === "shop") {
    return topic === "ORDER_CREATED"
      ? `/api/handlers/shop/create-order/${resourceId}`
      : `/api/handlers/shop/cancel-order/${resourceId}`;
  }
  return topic === "TRACKING_CREATED"
    ? `/api/handlers/channel/create-tracking/${resourceId}`
    : `/api/handlers/channel/cancel-purchase/${resourceId}`;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local");
}

export function validateWebhookConfiguration(input: {
  kind: WebhookResourceKind;
  resourceId: string;
  topic: string;
  endpoint: string;
  expectedOrigin?: string | null;
}): { topic: string; endpoint: string } {
  const topic = input.topic.trim().toUpperCase();
  if (!ALLOWED_TOPICS[input.kind].has(topic)) {
    throw new Error(`Unsupported ${input.kind} webhook topic`);
  }

  let endpoint: URL;
  try {
    endpoint = new URL(input.endpoint);
  } catch {
    throw new Error("Webhook endpoint must be an absolute URL");
  }

  const localDevelopment = process.env.NODE_ENV !== "production" && isLocalHostname(endpoint.hostname);
  if (endpoint.protocol !== "https:" && !(localDevelopment && endpoint.protocol === "http:")) {
    throw new Error("Webhook endpoint must use HTTPS");
  }
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("Webhook endpoint cannot contain credentials, query parameters, or fragments");
  }
  if (endpoint.pathname !== expectedWebhookPath(input.kind, input.resourceId, topic)) {
    throw new Error("Webhook endpoint path does not match the requested resource and topic");
  }

  if (input.expectedOrigin) {
    let expectedOrigin: string;
    try {
      expectedOrigin = new URL(input.expectedOrigin).origin;
    } catch {
      throw new Error("Configured Openship origin is invalid");
    }
    if (endpoint.origin !== expectedOrigin) {
      throw new Error("Webhook endpoint must use this Openship origin");
    }
  }

  return { topic, endpoint: endpoint.toString() };
}

export function assertWebhookBelongsToResource(input: {
  kind: WebhookResourceKind;
  resourceId: string;
  endpoint: string;
  expectedOrigin: string;
}): void {
  const topics = [...ALLOWED_TOPICS[input.kind]];
  const absoluteEndpoint = new URL(input.endpoint, input.expectedOrigin).toString();
  const belongs = topics.some((topic) => {
    try {
      validateWebhookConfiguration({
        ...input,
        topic,
        endpoint: absoluteEndpoint,
      });
      return true;
    } catch {
      return false;
    }
  });
  if (!belongs) throw new Error("Webhook does not belong to the requested resource");
}

export function requestOrigin(context: any): string | null {
  const headers = context?.req?.headers || {};
  const hostValue = headers["x-forwarded-host"] || headers.host;
  const protocolValue = headers["x-forwarded-proto"] || "https";
  const host = Array.isArray(hostValue) ? hostValue[0] : hostValue;
  const protocol = Array.isArray(protocolValue) ? protocolValue[0] : protocolValue;
  if (!host) return null;
  try {
    return new URL(`${String(protocol).split(",")[0]}://${String(host).split(",")[0]}`).origin;
  } catch {
    return null;
  }
}

export async function requireWebhookOwner(
  context: any,
  kind: WebhookResourceKind,
  resourceId: string
): Promise<any> {
  const session = context.session;
  if (!session?.itemId) throw new Error("Authentication required");
  if (!session?.data?.role?.canManageWebhooks) {
    throw new Error("Webhook management permission required");
  }

  const list = kind === "shop" ? context.sudo().query.Shop : context.sudo().query.Channel;
  const resource = await list.findOne({
    where: { id: resourceId },
    query: kind === "shop"
      ? "id domain accessToken metadata webhookSecret user { id } platform { id name appKey appSecret createWebhookFunction getWebhooksFunction deleteWebhookFunction }"
      : "id domain accessToken metadata webhookSecret user { id } platform { id name appKey appSecret webhookSecret createWebhookFunction getWebhooksFunction deleteWebhookFunction }",
  });
  if (!resource || resource.user?.id !== session.itemId) {
    throw new Error(`${kind === "shop" ? "Shop" : "Channel"} not found`);
  }
  return resource;
}

export async function ensureConnectionWebhookSecret(
  context: any,
  kind: WebhookResourceKind,
  resource: any
): Promise<string> {
  const existing = String(resource.webhookSecret || "").trim();
  if (existing) return existing;

  const webhookSecret = crypto.randomBytes(32).toString("hex");
  const list = kind === "shop" ? context.sudo().query.Shop : context.sudo().query.Channel;
  await list.updateOne({
    where: { id: resource.id },
    data: { webhookSecret },
    query: "id",
  });
  resource.webhookSecret = webhookSecret;
  return webhookSecret;
}
