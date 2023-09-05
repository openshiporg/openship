import { GraphQLClient, gql } from "graphql-request";

const FETCH_FULFILLMENT_ORDER = gql`
  query ($id: ID!) {
    order(id: $id) {
      fulfillmentOrders(first: 1) {
        edges {
          node {
            id
            status
            fulfillments(first: 1) {
              edges {
                node {
                  id
                  trackingInfo {
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
`;

const UPDATE_FULFILLMENT_TRACKING_INFO = gql`
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
`;

const CREATE_FULFILLMENT = gql`
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
`;

export async function shopify({ order, trackingCompany, trackingNumber }) {
  const client = new GraphQLClient(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
    }
  );

  // Fetch the first fulfillment order
  const data = await client.request(FETCH_FULFILLMENT_ORDER, {
    id: `gid://shopify/Order/${order.orderId}`,
  });

  if (!data?.order?.fulfillmentOrders.edges) {
    // Handle error or throw an error
    console.error(
      "Unexpected response:",
      data.order.fulfillmentOrders.edges[0]?.node
    );
    throw new Error("Unexpected response from Shopify API");
  }

  const fulfillmentOrder = data.order.fulfillmentOrders.edges[0].node;
  console.log({ fulfillmentOrder });

  // if status of fulfillmentOrder is closed, it means the order has been fulfilled and we need to update the fulfillment to include the new tracking
  if (fulfillmentOrder.status === "CLOSED") {
    const fulfillment = fulfillmentOrder.fulfillments.edges[0].node;
    const updateResponseBody = await client.request(
      UPDATE_FULFILLMENT_TRACKING_INFO,
      {
        fulfillmentId: fulfillment.id,
        trackingInfoInput: {
          numbers: [
            trackingNumber,
            ...fulfillment.trackingInfo.map(({ number }) => number),
          ],
        },
      }
    );
    console.log({ updateResponseBody });
    return updateResponseBody;
  }

  // else if fulfillmentOrder is open, we create a new fulfillment
  const createResponseBody = await client.request(CREATE_FULFILLMENT, {
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
  });

  console.log({ createResponseBody });
  return createResponseBody;
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
