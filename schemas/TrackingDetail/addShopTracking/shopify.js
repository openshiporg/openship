export async function shopify({ order, trackingCompany, trackingNumber }) {
  const locationResponse = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: `query locations {
            locations(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }`,
      }),
    }
  );

  const {
    data: { locations },
    errors: locErrors,
  } = await locationResponse.json();


  const location = locations.edges[0].node.id;

  const fulfillResponse = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: `mutation fulfillmentCreate(
            $orderId: ID!
            $locationId: ID!
            $trackingNumbers: [String!]
            $trackingUrls: [String!]
            $trackingCompany: String
          ) {
            fulfillmentCreate(
              input: {
                orderId: $orderId
                locationId: $locationId
                trackingNumbers: $trackingNumbers
                trackingUrls: $trackingUrls
                trackingCompany: $trackingCompany
                notifyCustomer: true
              }
            ) {
              fulfillment {
                id
              }
              userErrors{
                message
                field
              }
            }
          }`,
        variables: {
          orderId: `gid://shopify/Order/${order.orderId}`,
          locationId: location,
          trackingNumbers: trackingNumber,
          trackingCompany: trackingCompany,
        },
      }),
    }
  );

  const {
    data: { fulfillmentCreate },
    errors: fulErrors,
  } = await fulfillResponse.json();


  if (fulfillmentCreate?.userErrors?.length > 0) {
    const orderResponse = await fetch(
      `https://${order.shop.domain}/admin/api/graphql.json`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": order.shop.accessToken,
        },
        method: "POST",
        body: JSON.stringify({
          query: `query order($id: ID!) {
              order(id: $id) {
                fulfillments(first: 1) {
                  id
                  trackingInfo {
                    number
                  }
                }
              }
            }`,
          variables: {
            id: `gid://shopify/Order/${order.orderId}`,
          },
        }),
      }
    );

    const {
      data: {
        order: { fulfillments },
      },
      errors: orderErrors,
    } = await orderResponse.json();

    if (fulfillments?.length > 0) {
      const fulfillUpdateResponse = await fetch(
        `https://${order.shop.domain}/admin/api/graphql.json`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": order.shop.accessToken,
          },
          method: "POST",
          body: JSON.stringify({
            query: `mutation fulfillmentTrackingInfoUpdate(
              $fulfillmentId: ID!
              $trackingDetails: [TrackingInfoInput!]
              $trackingCompany: String
            ) {
              fulfillmentTrackingInfoUpdate(
                fulfillmentId: $fulfillmentId
                trackingInfoUpdateInput: {
                  trackingDetails: $trackingDetails
                  trackingCompany: $trackingCompany
                  notifyCustomer: true
                }
              ) {
                fulfillment {
                  id               
                }
                userErrors{
                  message
                  field
                }
              }
            }`,
            variables: {
              fulfillmentId: fulfillments[0].id,
              trackingDetails: [
                {
                  number: trackingNumber,
                },
                ...fulfillments[0].trackingInfo
              ],
              trackingCompany: trackingCompany,
            },
          }),
        }
      );

      const { data: fulfillmentTrackingInfoUpdateData } =
        await fulfillUpdateResponse.json();
      return fulfillmentTrackingInfoUpdateData;
    }
  }
}
