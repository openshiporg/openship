import ShopifyToken from "shopify-token";

export default async (req, res) => {
  try {
    if (!req.query.shop) {
      return res.status(400).json({ status: "error", body: "Bad Request" });
    }

    const { shop } = req.query;

    if (process.env.CHANNEL_SHOPIFY_EXTERNAL_AUTH) {
      return res
        .status(422)
        .redirect(
          `${process.env.CHANNEL_SHOPIFY_EXTERNAL_AUTH}?shop=${shop}&instance=${process.env.FRONTEND_URL}`
        );
    }

    const shopifyToken = new ShopifyToken({
      redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/channel/shopify/callback`,
      sharedSecret: process.env.CHANNEL_SHOPIFY_SECRET,
      apiKey: process.env.CHANNEL_SHOPIFY_API_KEY,
      scopes: [
        "write_orders",
        "write_products",
        "read_orders",
        "read_products",
        "read_fulfillments",
        "write_fulfillments",
        "write_draft_orders",
        "read_assigned_fulfillment_orders",
        "write_assigned_fulfillment_orders",
        "read_merchant_managed_fulfillment_orders",
        "write_merchant_managed_fulfillment_orders",
        "read_shopify_payments_disputes",
      ],
      accessMode: "offline",
      timeout: 10000,
    });

    shopifyToken.shop = shop.replace(".myshopify.com", ""); // TODO: remove, already handled in app
    const nonce = shopifyToken.generateNonce();
    const uri = shopifyToken.generateAuthUrl(
      shopifyToken.shop,
      undefined,
      nonce
    );

    console.log(`Redirect to ${uri}`);
    // return res.status(200).json({ status: 'success', body: uri });

    return res.status(200).redirect(uri);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "error" });
  }
};
