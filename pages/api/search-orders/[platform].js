import { gql, GraphQLClient } from "graphql-request";
import walmartMarketplaceApi, {
  OrdersApi,
  ItemsApi,
  defaultParams,
} from "@whitebox-co/walmart-marketplace-api";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Search orders endpoint for platform not found" });
  }

  try {
    const { error, orders } = await transformer[platform](req, res);

    if (error) {
      return res.status(400).json({ error });
    } else {
      return res.status(200).json({
        orders,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `${platform} search orders endpoint failed, please try again. ${err}`,
    });
  }
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    const headers = {
      "X-Auth-Token": req.query.accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${req.query.domain}/v2/orders?is_deleted=false`,
      {
        method: "GET",
        headers: headers,
      }
    );

    const data = await response.json();

    const promises = data.map((value, index) => {
      return Promise.all([
        fetch(value.shipping_addresses.url, {
          method: "GET",
          headers: headers,
        }).then((res) => res.json()),
        fetch(`${value.products.url}?include=images`, {
          method: "GET",
          headers: headers,
        }).then((res) => res.json()),
      ]);
    });

    const result = await Promise.all(promises);

    const productPromises = result.map((value) => {
      return fetch(
        `https://api.bigcommerce.com/stores/${req.query.domain}/v3/catalog/products/${value[1][0].product_id}/images`,
        {
          method: "GET",
          headers: headers,
        }
      ).then((res) => res.json());
    });

    const images = await Promise.all(productPromises);

    const arr = result.map(([shippingData, productData], key) => {
      const { id, date_created } = data[key];
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
      } = shippingData[0];

      return {
        orderId: id.toString(),
        orderName: `#${id}`,
        link: `https://${req.query.domain}/manage/orders/${id}`,
        date: Intl.DateTimeFormat("en-US").format(Date.parse(date_created)),
        first_name,
        last_name,
        streetAddress1: street_1,
        streetAddress2: street_2,
        city,
        state,
        zip,
        email,
        country,
        cartItems: [],
        cursor: "",
        lineItems: productData.map(
          ({ id, name, quantity, product_id, variant_id, base_price }) => ({
            name,
            quantity,
            price: base_price,
            image: images[key].data ? images[key].data[0].url_zoom : "",
            productId: variant_id.toString(),
            variantId: product_id.toString(),
            lineItemId: id.toString(),
          })
        ),
      };
    });

    return { orders: arr };
  },
  shopify: async (req, res) => {
    const shopifyClient = new GraphQLClient(
      `https://${req.query.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.query.accessToken,
        },
      }
    );

    const { orders } = await shopifyClient.request(
      gql`
        query (
          $first: Int
          $after: String
          $before: String
          $last: Int
          $query: String
        ) {
          orders(
            first: $first
            after: $after
            before: $before
            last: $last
            reverse: true
            query: $query
          ) {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              node {
                id
                email
                name
                processedAt
                metafield(namespace: "oscart", key: "oscart") {
                  value
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      quantity
                      variantTitle
                      variant {
                        id
                      }
                      product {
                        id
                      }
                      discountedUnitPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                      id
                      name
                      image {
                        originalSrc
                      }
                      discountedTotal
                    }
                  }
                }
                fulfillments(first: 25) {
                  trackingInfo {
                    company
                    number
                    url
                  }
                }
                note
                shippingAddress {
                  address1
                  address2
                  city
                  name
                  provinceCode
                  zip
                  country
                }
                totalReceivedSet {
                  shopMoney {
                    amount
                  }
                }
              }
              cursor
            }
          }
        }
      `,
      { query: req.query.searchEntry, first: 10 }
    );

    const arr = [];

    orders?.edges?.forEach(
      ({
        cursor,
        node: {
          id,
          name,
          email,
          processedAt,
          lineItems,
          metafield,
          shippingAddress: {
            address1,
            address2,
            city,
            provinceCode,
            zip,
            country,
            name: shipName,
          },
        },
      }) => {
        try {
          const newData = {
            orderId: id,
            orderName: name,
            link: `https://${req.query.domain}/admin/orders/${id
              .split("/")
              .pop()}`,
            date: Intl.DateTimeFormat("en-US").format(Date.parse(processedAt)),
            first_name: shipName.split(" ")[0],
            last_name: shipName.split(" ")[1] || shipName.split(" ")[0],
            streetAddress1: address1,
            streetAddress2: address2,
            city,
            state: provinceCode,
            zip,
            country,
            email,
            cartItems: metafield && JSON.parse(metafield.value),
            cursor,
            lineItems: lineItems.edges.map(
              ({
                node: {
                  id,
                  name,
                  quantity,
                  product,
                  variant,
                  image: { originalSrc },
                  discountedUnitPriceSet: {
                    shopMoney: { amount },
                  },
                },
              }) => ({
                name,
                quantity,
                price: amount,
                image: originalSrc,
                productId: product.id.split("/").pop(),
                variantId: variant.id.split("/").pop(),
                lineItemId: id.split("/").pop(),
              })
            ),
          };
          arr.push(newData);
        } catch {}
      }
    );

    return { orders: arr };
  },
  walmart: async (req, res) => {
    try {
      const ordersApi = await walmartMarketplaceApi.getConfiguredApi(
        OrdersApi,
        {
          clientId: req.query.clientId,
          clientSecret: req.query.clientSecret,
        }
      );

      const orders = await ordersApi.getAllOrders({ productInfo: true });
      console.log(
        orders.data.list.elements.order[0].orderLines.orderLine[0]
          .orderLineQuantity
      );
      return {
        orders: orders.data.list.elements.order.map(
          ({
            purchaseOrderId,
            customerOrderId,
            customerEmailId,
            orderDate,
            orderLines: { orderLine },
            shippingInfo: {
              postalAddress: {
                name,
                address1,
                address2,
                city,
                state,
                postalCode,
                country,
              },
            },
          }) => {
            return {
              orderId: purchaseOrderId,
              orderName: customerOrderId,
              link: `https://${req.query.domain}/admin/orders/${purchaseOrderId}`,
              date: Intl.DateTimeFormat("en-US").format(orderDate),
              first_name: name.split(" ")[0],
              last_name: name.split(" ")[1] || name.split(" ")[0],
              streetAddress1: address1,
              streetAddress2: address2,
              city,
              state,
              zip: postalCode,
              country,
              email: customerEmailId,
              lineItems: orderLine.map(
                ({ item, orderLineQuantity, charges: { charge } }) => ({
                  name: item.productName,
                  quantity: parseInt(orderLineQuantity.amount),
                  price: charge[0].chargeAmount.amount,
                  image: item.imageUrl,
                  productId: "0",
                  variantId: item.sku,
                })
              ),
            };
          }
        ),
      };
    } catch (err) {
      console.log(err.response.data.error);
    }
  },
  woocommerce: async (req, res) => {
    const { domain, accessToken, searchEntry } = req.query;
    const response = await fetch(
      `${domain}/wp-json/wc/v3/orders/?search=${searchEntry}`,
      {
        headers: {
          Authorization: "Basic " + btoa(accessToken),
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();

    console.log(data[0].shipping);
    if (!response.ok) {
      throw new Error(data.message || "Unable to fetch orders.");
    }
    const orders = data.map((order) => ({
      orderId: order.id.toString(),
      orderName: order.number.toString(),
      link: order._links.self[0].href,
      date: order.date_created,
      first_name: order.shipping.first_name,
      last_name: order.shipping.last_name,
      streetAddress1: order.shipping.address_1,
      streetAddress2: order.shipping.address_2,
      city: order.shipping.city,
      state: order.shipping.state,
      zip: order.shipping.postcode,
      country: order.shipping.country,
      lineItems: order.line_items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image.src,
        productId: item.product_id,
        variantId: item.variation_id,
        lineItemId: item.id,
      })),
    }));
    return { orders };
  },
};
