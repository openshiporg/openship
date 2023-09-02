import { query } from ".keystone/api";
import { placeMultipleOrders } from "keystone/lib/placeMultipleOrders";
import { removeEmpty } from "keystone/lib/removeEmpty";
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

      console.log({ webhookOrder });
    }
  } catch (error) {
    console.log("errr", error);
  }
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    if (req.body) {
      const existingShop = await query.Shop.findOne({
        where: {
          domain: req.body.producer.split("/")[1],
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

      const headers = {
        "X-Auth-Token": existingShop.accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const orderId = req.body.data.id;
      const orderRes = await fetch(
        `https://api.bigcommerce.com/stores/${existingShop.domain}/v2/orders/${orderId}`,
        {
          headers,
        }
      );
      console.log({ orderRes });

      const orderData = await orderRes.json();

      console.log({ orderData });

      // const result = await Promise.all([
      //   fetch(orderData.shipping_addresses.url, {
      //     method: "GET",
      //     headers: headers,
      //   }).then((res) => res.json()),
      //   fetch(`${orderData.products.url}?include=images`, {
      //     method: "GET",
      //     headers: headers,
      //   }).then((res) => res.json()),
      // ]);

      // console.log(result[0]);

      // const productPromises = result.map((value) => {
      //   return fetch(
      //     `https://api.bigcommerce.com/stores/${existingShop.domain}/v3/catalog/products/${value[1][0].product_id}/images`,
      //     {
      //       method: "GET",
      //       headers,
      //     }
      //   ).then((res) => res.json());
      // });

      // const images = await Promise.all(productPromises);

      const shippingAddresses = await fetch(orderData.shipping_addresses.url, {
        method: "GET",
        headers: headers,
      }).then((res) => res.json());

      console.log({ shippingAddresses });

      const orderProducts = await fetch(
        `${orderData.products.url}?include=images`,
        {
          method: "GET",
          headers: headers,
        }
      ).then((res) => res.json());

      console.log({ orderProducts });

      const images = await Promise.all(
        orderProducts.map((value) => {
          return fetch(
            `https://api.bigcommerce.com/stores/${existingShop.domain}/v3/catalog/products/${value.product_id}/images`,
            {
              method: "GET",
              headers,
            }
          ).then((res) => res.json());
        })
      );

      // const shippingAddresses = await shippingResponse.text();

      // const { addresses } = convertXmlToJson(shippingAddresses);

      // console.log({ addresses });

      // const orderProductsResponse = await fetch(
      //   `https://api.bigcommerce.com/stores/${existingShop.domain}/v2/orders/${orderId}/products`,
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       "X-Auth-Token": existingShop.accessToken,
      //     },
      //     method: "GET",
      //   }
      // );

      // const orderProducts = await orderProductsResponse.text();

      // const { products } = convertXmlToJson(orderProducts);

      // const productsArray = Array.isArray(products.product)
      //   ? products.product
      //   : [products.product];

      // Construct the response object
      const lineItemsOutput = orderProducts.map(
        ({ id, name, quantity, product_id, variant_id, base_price }, key) => ({
          name,
          quantity,
          price: base_price,
          image: images[key].data ? images[key].data[0].url_zoom : "",
          productId: product_id.toString(),
          variantId: variant_id.toString(),
          lineItemId: id.toString(),
          user: { connect: { id: existingShop.user.id } },
        })
      );

      const {
        first_name,
        last_name,
        street_1,
        street_2,
        city,
        state,
        zip,
        email,
        country,
      } = shippingAddresses[0];

      return {
        orderId: orderData.id,
        orderName: `#${orderData.id}`,
        first_name,
        last_name,
        streetAddress1: street_1,
        streetAddress2: street_2,
        city,
        state,
        zip,
        email,
        country,
        shippingMethod: orderData.shipping_methods,
        currency: orderData.currency_code,
        phoneNumber: orderData.billing_address.phone,
        note: orderData.customer_message,
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

function convertXmlToJson(xml) {
  let json = null;
  const parser = new xml2js.Parser({ explicitArray: false });
  parser.parseString(xml, (error, result) => {
    if (error) {
      throw new Error("Failed to parse XML: " + error);
    }
    json = result;
  });
  return json;
}
