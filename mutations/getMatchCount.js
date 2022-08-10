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
  `,
  });

  const filteredValues = allMatches.filter(
    ({ inputCount }) => inputCount === inputArray.length
  );

  // if (filteredValues.length) {
  //   return allMatches.length;
  // } else {
  //   return 0;
  // }
  return filteredValues.length;
}

async function getMatchCount(root, { input }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const existingMatchesCount = await getMatches({
    inputArray: input,
    user: { id: sesh.itemId },
    context,
  });

  return existingMatchesCount;
}

export default getMatchCount;
