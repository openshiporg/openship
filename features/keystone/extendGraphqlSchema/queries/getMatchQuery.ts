import { searchChannelProducts } from "../../utils/channelProviderAdapter";

async function getMatches({ inputArray, user, context }: {
  inputArray: any[];
  user: { id: string };
  context: any;
}) {
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
    ({ inputCount }: any) => inputCount === inputArray.length
  );

  if (filt) {
    return [filt];
  }
  throw new Error("No match found");
}

async function getMatch(root: any, { input }: { input: any[] }, context: any) {
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

        const searchResult = await searchChannelProducts({
          platform: channel.platform,
          searchEntry: productId,
          after: undefined,
        });
        
        const products = searchResult.products;

        const [productInfo] = products;
        productInfo.name = productInfo.title;
        output.push({ ...productInfo, channelName: channel.name, quantity });
      }
    }
    return output;
  }
}

export default getMatch;