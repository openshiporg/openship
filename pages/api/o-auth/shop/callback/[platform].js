import { gql } from "graphql-request";
import { checkAuth, gqlClient } from "keystone/lib/checkAuth";


export const CREATE_SHOP_MUTATION = gql`
  mutation CREATE_SHOP_MUTATION($data: ShopCreateInput!) {
    createShop(data: $data) {
      id
    }
  }
`;

const PLATFORM_QUERY = gql`
  query GetShopPlatform($id: ID!) {
    shopPlatform(where: { id: $id }) {
      id
      appKey
      appSecret
      callbackUrl
      oAuthCallbackFunction
    }
  }
`;

const SHOPS_QUERY = gql`
  query GetShops($domain: String!) {
    shops(where: { domain: { equals: $domain } }) {
      id
      platform {
        id
      }
    }
  }
`;

const UPDATE_SHOP_MUTATION = gql`
  mutation UpdateShop($id: ID!, $data: ShopUpdateInput!) {
    updateShop(where: { id: $id }, data: $data) {
      id
    }
  }
`;

export default async (req, res) => {
  try {
    const { platform, ...queryParams } = req.query;
    const { authenticatedItem } = await checkAuth(req);

    if (!authenticatedItem) {
      return res
        .status(422)
        .redirect(
          `${process.env.FRONTEND_URL}/signin?from=${encodeURIComponent(
            req.url
          )}`
        );
    }

    if (!platform) {
      return res.status(422).json({ status: "Unprocessable Entity" });
    }

    const { shop } = req.query;

    const { shopPlatform } = await gqlClient(req).request(PLATFORM_QUERY, {
      id: platform,
    });

    if (!shopPlatform) {
      return res.status(404).json({ error: "Platform not found" });
    }

    const platformFunctions = await import(
      `../../../../../shopAdapters/${shopPlatform.oAuthCallbackFunction}.js`
    );
    console.log({ queryParams });
    const accessToken = await platformFunctions.callback(queryParams, {
      appKey: shopPlatform.appKey,
      appSecret: shopPlatform.appSecret,
      redirectUri: shopPlatform.callbackUrl,
      scopes: platformFunctions.scopes(), // Assuming the scopes function is defined in the platformFunctions
    });

    async function upsertShop(shop, accessToken) {
      const { shops } = await gqlClient(req).request(SHOPS_QUERY, {
        domain: shop,
      });

      if (shops.length > 0) {
        const foundShop = shops[0];
        await gqlClient(req).request(UPDATE_SHOP_MUTATION, {
          id: foundShop.id,
          data: { accessToken },
        });
      } else {
        await gqlClient(req).request(CREATE_SHOP_MUTATION, {
          data: {
            name: shop.split(".")[0].toUpperCase(),
            accessToken,
            domain: shop,
            platform: { connect: { id: shopPlatform.id } },
            user: { connect: { id: authenticatedItem.id } },
          },
        });
      }
    }

    await upsertShop(shop, accessToken);

    const redirectUrl = `${process.env.FRONTEND_URL}/shops`;
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};
