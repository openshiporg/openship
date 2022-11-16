import { gql, GraphQLClient } from "graphql-request";
import BigCommerce from "node-bigcommerce";
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
      error: `${platform} search orders endpoint failed, please try again.`,
    });
  }
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    const bigCommerceClient = new BigCommerce({
      clientId: "m042y7fkmepa9vxp1n0eq56lk0ffk7b",
      accessToken: req.query.accessToken,
      storeHash: req.query.domain,
      responseType: 'json'
    });
  const arr = [];

  const data = await bigCommerceClient.get('/orders');
  // data?.forEach(({ id, price, primary_image, name, availability }) => {
  //   const newData = {
  //     image: primary_image.tiny_url,
  //     title: name,
  //     productId: id,
  //     price: price,
  //     availableForSale: availability,
  //     variantId: id,
  //   }

  //   arr.push(newData);
  // });

  return { orders: data }
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
        orders.data.list.elements.order[0].orderLines.orderLine[0].orderLineQuantity
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
};
