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

    return res.redirect(`https://${shop}.mybigcommerce.com/manage/app/43060`);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "error" });
  }
};
