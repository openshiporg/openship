import { gql } from "graphql-request";
import { CREATE_SHOP_MUTATION } from "@graphql/shops";
import { checkAuth, gqlClient } from "keystone/lib/checkAuth";

const PLATFORM_QUERY = gql`
  query GetShopPlatform($id: ID!) {
    shopPlatform(where: { id: $id }) {
      id
      key
      apiKey
      apiSecret
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
      `../../../shopFunctions/${shopPlatform.key}.js`
    );
    const config = platformFunctions.getConfig({
      apiKey: shopPlatform.apiKey,
      apiSecret: shopPlatform.apiSecret,
    });

    const accessToken = await platformFunctions.callback(queryParams, config);

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
