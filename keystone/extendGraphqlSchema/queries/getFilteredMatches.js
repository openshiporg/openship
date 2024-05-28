async function getFilteredMatches(root, args, context) {
  // Fetch all matches with input and output quantity equals to 1
  const matches = await context.query.Match.findMany({
    where: {
      input: {
        every: {
          quantity: { equals: 1 },
        },
      },
      output: {
        every: {
          quantity: { equals: 1 },
        },
      },
    },
    query: `id input { id quantity productId variantId lineItemId externalDetails { title image price productLink inventory inventoryTracked } shop { id name } } output { id quantity productId variantId lineItemId externalDetails { title image price productLink inventory inventoryTracked } price channel { id name } }`,
  });

  // Filter matches to include only those with exactly one input and one output
  const filteredMatches = matches.filter((match) => {
    return (
      match.input.length === 1 &&
      match.output.length === 1 &&
      match.input[0].quantity === 1 &&
      match.output[0].quantity === 1 &&
      match.input[0].externalDetails.inventory &&
      match.output[0].externalDetails.inventory &&
      match.input[0].externalDetails.inventory !==
        match.output[0].externalDetails.inventory
    );
  });

  // Return the filtered matches
  return filteredMatches;
}

export default getFilteredMatches;
