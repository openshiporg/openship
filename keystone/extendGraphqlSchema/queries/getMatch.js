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
        name
        platform {
          id
          searchProductsFunction
        }
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
        const { searchProductsFunction } = channel.platform;

        let products;
        if (searchProductsFunction.startsWith("http")) {
          const params = new URLSearchParams({
            searchEntry: productId,
            domain: channel.domain,
            accessToken: channel.accessToken,
          }).toString();

          const searchRes = await fetch(`${searchProductsFunction}?${params}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-type": "application/json",
              "X-Requested-With": "Fetch",
            },
          });

          if (!searchRes.ok) {
            throw new Error(`Failed to fetch products: ${searchRes.statusText}`);
          }

          const data = await searchRes.json();
          products = data.products;
        } else {
          const channelAdapters = await import(
            `../../../channelAdapters/${searchProductsFunction}.js`
          );
          const result = await channelAdapters.searchProducts({
            searchEntry: productId,
            domain: channel.domain,
            accessToken: channel.accessToken,
          });
          products = result.products;
        }

        const [productInfo] = products;
        productInfo.name = productInfo.title;
        output.push({ ...productInfo, channelName: channel.name, quantity });
      }
    }
    return output;
  }
}

export default getMatch;