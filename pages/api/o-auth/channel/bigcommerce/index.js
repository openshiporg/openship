import BigCommerce from "node-bigcommerce";

export default async (req, res) => {
  try {
    if (!req.query.shop) {
      return res.status(400).json({ status: "error", body: "Bad Request" });
    }

    const { shop } = req.query;

    if (process.env.SHOP_BIGCOMMERCE_EXTERNAL_AUTH) {
      return res
        .status(422)
        .redirect(
          `${process.env.SHOP_BIGCOMMERCE_EXTERNAL_AUTH}?shop=${shop}&instance=${process.env.FRONTEND_URL}`
        );
    }

    return res.redirect(`https://${shop}.mybigcommerce.com/manage/app/43281`);

    // const bigcommerce = new BigCommerce({
    //   secret: process.env.SHOP_BIGCOMMERCE_SECRET,
    //   clientId: process.env.SHOP_BIGCOMMERCE_API_KEY,
    //   callback:
    //     "https://faf5-142-147-59-185.ngrok.io/api/o-auth/bigcommerce/callback",
    //   responseType: "json",
    // });

    // await bigcommerce// shopifyToken.shop = shop.replace(".myshopify.com", ""); // TODO: remove, already handled in app
    // // const nonce = shopifyToken.generateNonce();
    // // const uri = shopifyToken.generateAuthUrl(
    // //   shopifyToken.shop,
    // //   undefined,
    // //   nonce
    // // );

    // .console
    //   .log(`Redirect to ${uri}`);
    // // return res.status(200).json({ status: 'success', body: uri });

    // return res.status(200).redirect(uri);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "error" });
  }
};
