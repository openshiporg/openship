async function getMatches({ inputArray, user, context }) {
  const allMatches = await context.query.Match.findMany({
    where: {
      user: { id: { equals: user.id } },
      AND: inputArray.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId,
            variantId,
            quantity,
          },
        },
      })),
    },
    query: ` 
    id
    inputCount
    outputCount
    input {
      id
      quantity
      productId
      variantId
      shop {
        id
      }
      user {
        id
      }
    }
    output {
      id
      quantity
      productId
      variantId
      price
      channel {
        id
        domain
        accessToken
        searchProductsEndpoint
        name
      }
      user {
        id
      }
    }
  `,
  });

  const [filt] = allMatches.filter(
    ({ inputCount }) => inputCount === inputArray.length
  );

  console.log({ filt });

  if (filt) {
    return [filt];
  }
  throw new Error("No match found");
}

async function getMatch(root, { input }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const existingMatches = await getMatches({
    inputArray: input,
    user: { id: sesh.itemId },
    context,
  });

  const cleanEM = existingMatches.filter((a) => a !== undefined);

  console.log

  if (cleanEM.length > 0) {
    const output = [];
    for (const existingMatch of cleanEM) {
      for (const {
        channel,
        productId,
        variantId,
        quantity,
        price: matchPrice,
        id,
        userId,
        channelId,
        ...rest
      } of existingMatch.output) {
        // console.log({ existingMatch });
        const params = new URLSearchParams({
          channelId: channel.id,
          domain: channel.domain,
          accessToken: channel.accessToken,
          productId,
          variantId,
        }).toString();

        const searchRes = await fetch(
          channel.searchProductsEndpoint.includes("http")
            ? `${channel.searchProductsEndpoint}?${params}`
            : `${process.env.FRONTEND_URL}${channel.searchProductsEndpoint}?${params}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-type": "application/json",
              "X-Requested-With": "Fetch",
            },
          }
        );

        const { products } = await searchRes.json();

        const [productInfo] = products;
        productInfo.name = productInfo.title;
        output.push({ ...productInfo, channelName: channel.name, quantity });
      }
    }
    return output;
  }
}

export default getMatch;

// async function getMatches({ inputArray, user, context }) {
//   const allMatches = await context.query.Match.findMany({
//     where: {
//       user: { id: { equals: user.id } },
//       AND: inputArray.map(({ productId, variantId, quantity }) => ({
//         input: {
//           some: {
//             productId,
//             variantId,
//             quantity,
//           },
//         },
//       })),
//     },
//     query: ` 
//     id
//     inputCount
//     outputCount
//     input {
//       id
//       quantity
//       productId
//       variantId
//       shop {
//         id
//       }
//       user {
//         id
//       }
//     }
//     output {
//       id
//       quantity
//       productId
//       variantId
//       price
//       channel {
//         id
//         domain
//         accessToken
//         searchEndpoint
//         name
//       }
//       user {
//         id
//       }
//     }
//   `,
//   });

//   const [filt] = allMatches.filter(
//     ({ inputCount }) => inputCount === inputArray.length
//   );

//   console.log({ filt });

//   if (filt) {
//     return [filt];
//   }
//   throw new Error("No match found");
// }

// async function getMatch(root, { input }, context) {
//   // 1. Query the current user see if they are signed in
//   const sesh = context.session;
//   if (!sesh.itemId) {
//     throw new Error("You must be logged in to do this!");
//   }

//   const existingMatches = await getMatches({
//     inputArray: input,
//     user: { id: sesh.itemId },
//     context,
//   });

//   const cleanEM = existingMatches.filter((a) => a !== undefined);

//   console.log;

//   if (cleanEM.length > 0) {
//     const foundMatches = [];
//     for (const existingMatch of cleanEM) {
//       existingMatch.newOutput = [];
//       for (const {
//         channel,
//         productId,
//         variantId,
//         quantity,
//         price: matchPrice,
//         id,
//         ...rest
//       } of existingMatch.output) {
//         // console.log({ existingMatch });
//         const params = new URLSearchParams({
//           channelId: channel.id,
//           domain: channel.domain,
//           accessToken: channel.accessToken,
//           productId,
//           variantId,
//         }).toString();

//         const searchRes = await fetch(
//           channel.searchEndpoint.includes("http")
//             ? `${channel.searchEndpoint}?${params}`
//             : `${process.env.FRONTEND_URL}${channel.searchEndpoint}?${params}`,
//           {
//             method: "GET",
//             headers: {
//               Accept: "application/json",
//               "Content-type": "application/json",
//               "X-Requested-With": "Fetch",
//             },
//           }
//         );

//         const { products } = await searchRes.json();

//         const [productInfo] = products;
//         productInfo.name = productInfo.title;
//         existingMatch.newOutput.push({
//           ...productInfo,
//           channelName: channel.name,
//           quantity,
//         });
//         console.log(existingMatch.newOutput);
//         foundMatches.push(existingMatch);
//       }
//     }
//     return foundMatches;
//   }
// }

// export default getMatch;
