export default async (req, res) => {
  try {
    const bigcommerceResponse = await fetch(
      "https://login.bigcommerce.com/oauth2/token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.CHANNEL_BIGCOMMERCE_API_KEY,
          client_secret: process.env.CHANNEL_BIGCOMMERCE_SECRET,
          code: req.query.code,
          context: req.query.context,
          scope: req.query.scope,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.FRONTEND_URL}/api/o-auth/channel/bigcommerce/auth`,
        }),
      }
    );
    const { error, access_token, context, account_uuid } =
      await bigcommerceResponse.json();

    const params = new URLSearchParams({
      access_token,
      context,
      account_uuid,
      type: "channel"
    }).toString();

    console.log({ params });

    const redirectUrl = `${process.env.FRONTEND_URL}/bigcommerce/load?${params}`;
    
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};
