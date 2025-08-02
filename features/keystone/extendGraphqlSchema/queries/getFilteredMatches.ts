async function getFilteredMatches(root: any, args: any, context: any) {
  // Fetch all matches
  const matches = await context.query.Match.findMany({
    query: `
      id 
      outputPriceChanged
      inventoryNeedsToBeSynced { syncEligible sourceQuantity targetQuantity }
      input { 
        id quantity productId variantId lineItemId 
        externalDetails { title image price productLink inventory inventoryTracked } 
        shop { id name } 
      } 
      output { 
        id quantity productId variantId lineItemId 
        externalDetails { title image price productLink inventory inventoryTracked } 
        price channel { id name } 
      }
    `,
  });

  // console.log(matches);
  // Filter matches based on inventoryNeedsToBeSynced.syncEligible
  const filteredMatches = matches.filter((match: any) => match.inventoryNeedsToBeSynced.syncEligible);

  // Return the filtered matches
  return filteredMatches;
}

export default getFilteredMatches;