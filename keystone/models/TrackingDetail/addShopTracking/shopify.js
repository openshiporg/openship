import { gql } from "graphql-request";

export async function shopify({ order, trackingCompany, trackingNumber }) {
  // Fetch the first fulfillment order
  const foResponse = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: gql`
          query ($id: ID!) {
            order(id: $id) {
              fulfillmentOrders(first: 1) {
                edges {
                  node {
                    id
                    status
                    order {
                      legacyResourceId
                    }
                    assignedLocation {
                      name
                    }
                    fulfillments(first: 1) {
                      edges {
                        node {
                          id
                          status
                          trackingInfo {
                            company
                            number
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: `gid://shopify/Order/${order.orderId}`,
        },
      }),
    }
  );

  const foResponseBody = await foResponse.json();

  if (!foResponseBody.data?.order?.fulfillmentOrders.edges) {
    // Handle error or throw an error
    console.error("Unexpected response:", foResponseBody.data.order.fulfillmentOrders.edges[0].node);
    throw new Error("Unexpected response from Shopify API");
  }

  const fulfillmentOrder =
    foResponseBody.data.order.fulfillmentOrders.edges[0].node;

  console.log({ fulfillmentOrder });

  // if status of fulfillmentOrder is closed, it means the order has been fulfilled and we need to update the fulfillment to include the new tracking
  if (fulfillmentOrder.status === "CLOSED") {
    const fulfillment = fulfillmentOrder.fulfillments.edges[0].node;
    const fulfillmentTrackingInfoUpdateV2Response = await fetch(
      `https://${order.shop.domain}/admin/api/graphql.json`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": order.shop.accessToken,
        },
        method: "POST",
        body: JSON.stringify({
          query: gql`
            mutation fulfillmentTrackingInfoUpdateV2(
              $fulfillmentId: ID!
              $trackingInfoInput: FulfillmentTrackingInput!
            ) {
              fulfillmentTrackingInfoUpdateV2(
                fulfillmentId: $fulfillmentId
                trackingInfoInput: $trackingInfoInput
              ) {
                fulfillment {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            fulfillmentId: fulfillment.id,
            trackingInfoInput: {
              numbers: [
                trackingNumber,
                ...fulfillment.trackingInfo.map(({ number }) => number),
              ],
            },
          },
        }),
      }
    );

    const fulfillmentTrackingInfoUpdateV2Body = await fulfillmentTrackingInfoUpdateV2Response.json();

    console.log({ fulfillmentTrackingInfoUpdateV2Body });
  
    return fulfillmentTrackingInfoUpdateV2Body;
  }

  // else if fulfillmentOrder is open, we create a new fulfillment
  const fulfillmentCreateV2Response = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: gql`
          mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
            fulfillmentCreateV2(fulfillment: $fulfillment) {
              fulfillment {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          fulfillment: {
            lineItemsByFulfillmentOrder: [
              {
                fulfillmentOrderId: fulfillmentOrder.id,
              },
            ],
            trackingInfo: {
              company: trackingCompany,
              numbers: trackingNumber,
            },
          },
        },
      }),
    }
  );

  const fulfillmentCreateV2Body = await fulfillmentCreateV2Response.json();

  console.log({ fulfillmentCreateV2Body });

  return fulfillmentCreateV2Body;
}

// import { gql } from "graphql-request";

// export async function shopify({ order, trackingCompany, trackingNumber }) {
//   const locationResponse = await fetch(
//     `https://${order.shop.domain}/admin/api/graphql.json`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         "X-Shopify-Access-Token": order.shop.accessToken,
//       },
//       method: "POST",
//       body: JSON.stringify({
//         query: gql`
//           query locations {
//             locations(first: 1) {
//               edges {
//                 node {
//                   id
//                 }
//               }
//             }
//           }
//         `,
//       }),
//     }
//   );

//   const {
//     data: { locations },
//     errors: locErrors,
//   } = await locationResponse.json();

//   const location = locations.edges[0].node.id;

//   const fulfillResponse = await fetch(
//     `https://${order.shop.domain}/admin/api/graphql.json`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         "X-Shopify-Access-Token": order.shop.accessToken,
//       },
//       method: "POST",
//       body: JSON.stringify({
//         query: gql`
//           mutation fulfillmentCreate(
//             $orderId: ID!
//             $locationId: ID!
//             $trackingNumbers: [String!]
//             $trackingUrls: [String!]
//             $trackingCompany: String
//           ) {
//             fulfillmentCreate(
//               input: {
//                 orderId: $orderId
//                 locationId: $locationId
//                 trackingNumbers: $trackingNumbers
//                 trackingUrls: $trackingUrls
//                 trackingCompany: $trackingCompany
//                 notifyCustomer: true
//               }
//             ) {
//               fulfillment {
//                 id
//               }
//               userErrors {
//                 message
//                 field
//               }
//             }
//           }
//         `,
//         variables: {
//           orderId: `gid://shopify/Order/${order.orderId}`,
//           locationId: location,
//           trackingNumbers: trackingNumber,
//           trackingCompany: trackingCompany,
//         },
//       }),
//     }
//   );

//   const {
//     data: { fulfillmentCreate },
//     errors: fulErrors,
//   } = await fulfillResponse.json();

//   console.log({ fulErrors });

//   if (fulfillmentCreate?.userErrors?.length > 0) {
//     const orderResponse = await fetch(
//       `https://${order.shop.domain}/admin/api/graphql.json`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "X-Shopify-Access-Token": order.shop.accessToken,
//         },
//         method: "POST",
//         body: JSON.stringify({
//           query: `query order($id: ID!) {
//               order(id: $id) {
//                 fulfillments(first: 1) {
//                   id
//                   trackingInfo {
//                     number
//                   }
//                 }
//               }
//             }`,
//           variables: {
//             id: `gid://shopify/Order/${order.orderId}`,
//           },
//         }),
//       }
//     );

//     const {
//       data: {
//         order: { fulfillments },
//       },
//       errors: orderErrors,
//     } = await orderResponse.json();

//     if (fulfillments?.length > 0) {
//       const fulfillUpdateResponse = await fetch(
//         `https://${order.shop.domain}/admin/api/graphql.json`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "X-Shopify-Access-Token": order.shop.accessToken,
//           },
//           method: "POST",
//           body: JSON.stringify({
//             query: `mutation fulfillmentTrackingInfoUpdate(
//               $fulfillmentId: ID!
//               $trackingDetails: [TrackingInfoInput!]
//               $trackingCompany: String
//             ) {
//               fulfillmentTrackingInfoUpdate(
//                 fulfillmentId: $fulfillmentId
//                 trackingInfoUpdateInput: {
//                   trackingDetails: $trackingDetails
//                   trackingCompany: $trackingCompany
//                   notifyCustomer: true
//                 }
//               ) {
//                 fulfillment {
//                   id
//                 }
//                 userErrors{
//                   message
//                   field
//                 }
//               }
//             }`,
//             variables: {
//               fulfillmentId: fulfillments[0].id,
//               trackingDetails: [
//                 {
//                   number: trackingNumber,
//                 },
//                 ...fulfillments[0].trackingInfo,
//               ],
//               trackingCompany: trackingCompany,
//             },
//           }),
//         }
//       );

//       const { data: fulfillmentTrackingInfoUpdateData } =
//         await fulfillUpdateResponse.json();
//       return fulfillmentTrackingInfoUpdateData;
//     }
//   }
// }
