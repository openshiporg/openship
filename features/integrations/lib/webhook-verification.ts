import crypto from 'crypto'

/**
 * Verify Shopify webhook HMAC signature
 * @param rawBody - The raw request body as a string or Buffer
 * @param hmacHeader - The X-Shopify-Hmac-Sha256 header value
 * @param secret - The webhook secret (usually the Shopify app secret)
 * @returns boolean indicating if the webhook is authentic
 */
export function verifyShopifyWebhook(
  rawBody: string | Buffer,
  hmacHeader: string,
  secret: string
): boolean {
  if (!hmacHeader || !secret) {
    return false
  }

  // Ensure body is a string
  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')
  
  // Calculate the expected HMAC
  const hash = crypto
    .createHmac('sha256', secret)
    .update(bodyString, 'utf8')
    .digest('base64')

  // Compare with timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  )
}

/**
 * Verify WooCommerce webhook signature
 * @param rawBody - The raw request body
 * @param signatureHeader - The X-WC-Webhook-Signature header value
 * @param secret - The webhook secret
 * @returns boolean indicating if the webhook is authentic
 */
export function verifyWooCommerceWebhook(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false
  }

  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')
  
  // WooCommerce uses HMAC-SHA256 with base64 encoding
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signatureHeader)
  )
}

/**
 * Generic webhook verification for different platforms
 */
export function verifyWebhook(
  platform: string,
  rawBody: string | Buffer,
  headers: Record<string, string>,
  secret: string
): boolean {
  switch (platform.toLowerCase()) {
    case 'shopify':
      return verifyShopifyWebhook(
        rawBody,
        headers['x-shopify-hmac-sha256'] || '',
        secret
      )
    
    case 'woocommerce':
      return verifyWooCommerceWebhook(
        rawBody,
        headers['x-wc-webhook-signature'] || '',
        secret
      )
    
    // Add more platforms as needed
    default:
      console.warn(`Unknown platform for webhook verification: ${platform}`)
      return false
  }
}

/**
 * Extract raw body from request for webhook verification
 * This is critical because body parsers will modify the body
 */
export async function getRawBody(req: Request): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = req.body?.getReader()
  
  if (!reader) {
    throw new Error('Request body is not readable')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  // Combine all chunks into a single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return Buffer.from(result)
}

/**
 * Create a test webhook signature for testing purposes
 */
export function createTestWebhookSignature(
  platform: string,
  payload: any,
  secret: string
): string {
  const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload)
  
  switch (platform.toLowerCase()) {
    case 'shopify':
    case 'woocommerce':
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('base64')
    
    default:
      throw new Error(`Unknown platform for signature creation: ${platform}`)
  }
}