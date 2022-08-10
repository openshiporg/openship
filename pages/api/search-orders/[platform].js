import { gql, GraphQLClient } from "graphql-request";

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
        } catch {
        }
      }
    );

    return { orders: arr };
  },
};
