import { query } from ".keystone/api";
import { placeMultipleOrders } from "@lib/placeMultipleOrders";
import { removeEmpty } from "@lib/removeEmpty";
import { getMatches } from "mutations/addMatchToCart";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  try {
    const { platform } = req.query;

    if (transformer[platform]) {
      const createOrderData = await transformer[platform](req, res);


      const webhookOrder = await query.Order.createOne({
        // we remove null values since Keystone text fields don't like null values
        data: removeEmpty(createOrderData),
        query: `id shop { links { channel { id name } } }`,
      });

    }
  } catch (error) {
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    if (req.body) {
      const existingShop = await query.Shop.findOne({
        where: {
          domain: req.headers["x-shopify-shop-domain"],
        },
        query: `
        id
        domain
        accessToken
        user {
          id
          email
        }
        links {
          channel {
            id
            name
          }
        }
      `,
      });
      const lineItemsOutput = await Promise.all(
        req.body.line_items.map(
          async ({
            id,
            name,
            price,
            quantity,
            variant_id,
            product_id,
            sku,
          }) => {
            const pvRes = await fetch(
              `https://${existingShop.domain}/admin/api/graphql.json`,
              {
                headers: {
                  "Content-Type": "application/json",
                  "X-Shopify-Access-Token": existingShop.accessToken,
                },
                method: "POST",
                body: JSON.stringify({
                  query: `
                  query productVariant($id: ID!) {
                    productVariant(id: $id) {
                      image {
                        originalSrc
                      }
                      product {
                        id
                        images(first : 1) {
                          edges {
                            node {
                              originalSrc
                            }
                          }
                        }
                      }
                    }
                  }
                `,
                  variables: {
                    id: `gid://shopify/ProductVariant/${variant_id}`,
                  },
                }),
              }
            );

            const { data: pvData, errors: pvError } = await pvRes.json();

            if (pvData?.productVariant) {
              return {
                name,
                price,
                lineItemId: id.toString(),
                quantity,
                image:
                  (pvData.productVariant.image &&
                    pvData.productVariant.image.originalSrc) ||
                  pvData.productVariant.product.images.edges[0]?.node
                    .originalSrc,
                productId: product_id.toString(),
                variantId: variant_id.toString(),
                sku: sku.toString(),
                user: { connect: { id: existingShop.user.id } },
              };
            }
            return null;
          }
        )
      );
      return {
        orderId: req.body.id,
        orderName: req.body.name,
        email: req.body.email,
        first_name: req.body.shipping_address.first_name,
        last_name: req.body.shipping_address.last_name,
        streetAddress1: req.body.shipping_address.address1,
        streetAddress2: req.body.shipping_address.address2,
        city: req.body.shipping_address.city,
        state: req.body.shipping_address.province_code,
        zip: req.body.shipping_address.zip,
        country: req.body.shipping_address.country_code,
        shippingMethod: req.body.shipping_lines,
        currency: req.body.currency,
        phoneNumber: req.body.shipping_address.phone,
        note: req.body.note,
        lineItems: { create: lineItemsOutput },
        user: { connect: { id: existingShop.user.id } },
        shop: { connect: { id: existingShop.id } },
        status: "INPROCESS",
        linkOrder: true,
        matchOrder: true,
        processOrder: true,
      };
    }
  },
};
