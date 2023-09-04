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
                    assignedLocation {
                      id
                    }
                  }
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
    data: { order: {fulfillmentOrders} },
    errors: foErrors,
  } = await foResponse.json();

  if (foErrors) {
    console.error(foErrors);
    throw new Error(foErrors);
  }

  const fulfillmentOrder = fulfillmentOrders.edges[0].node;

  // Accept the fulfillment order
  const acceptResponse = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: gql`
          mutation ($id: ID!) {
            fulfillmentOrderAccept(id: $id) {
              fulfillmentOrder {
                id
              }
              userErrors {
                field
                message
              }
            }
          }`,
        variables: {
          id: fulfillmentOrder.id,
        },
      }),
    }
  );

  const {
    data: { fulfillmentOrderAccept },
    errors: acceptErrors,
  } = await acceptResponse.json();

  if (acceptErrors || fulfillmentOrderAccept.userErrors.length > 0) {
    console.error(acceptErrors || fulfillmentOrderAccept.userErrors);
    throw new Error(acceptErrors || fulfillmentOrderAccept.userErrors);
  }

  // Fulfill the fulfillment order
  const fulfillResponse = await fetch(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        query: gql`
          mutation fulfillmentOrderFulfill(
            $id: ID!
            $trackingCompany: String!
            $trackingNumber: String!
          ) {
            fulfillmentOrderFulfill(
              id: $id
              fulfillmentInput: {
                tracker: { 
                  company: $trackingCompany
                  number: $trackingNumber
                } 
              }
            ) {
              fulfillment {
                id
              }
              userErrors {
                field
                message
              }
            }
          }`,
        variables: {
          id: fulfillmentOrder.id,
          trackingCompany: trackingCompany,
          trackingNumber: trackingNumber,
        },
      }),
    }
  );

  const {
    data: { fulfillmentOrderFulfill },
    errors: fulfillErrors,
  } = await fulfillResponse.json();

  if (
    fulfillErrors ||
    fulfillmentOrderFulfill.userErrors.length > 0
  ) {
    const errors =
      fulfillErrors || fulfillmentOrderFulfill.userErrors;
    console.error(errors);
    throw new Error(errors);
  }
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
