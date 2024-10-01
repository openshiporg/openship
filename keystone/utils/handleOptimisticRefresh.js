export const handleOptimisticRefresh = async ({
  createWithData,
  query,
  variables,
  inputData,
  optimisticItem,
  refetch,
  client
}) => {
  const existingItems = client.readQuery({
    query,
    variables,
  });

  client.writeQuery({
    query,
    variables,
    data: {
      items: [optimisticItem, ...existingItems.items],
      count: existingItems.count + 1,
    },
  });

  try {
    const result = await createWithData({
      variables: inputData,
      optimisticResponse: {
        __typename: "Mutation",
        createShopPlatform: {
          __typename: "ShopPlatform",
          ...optimisticItem,
        },
      },
      update: (cache, { data }) => {
        const newItems = [data.createShopPlatform, ...existingItems.items];
        cache.writeQuery({
          query,
          variables,
          data: {
            items: newItems,
            count: existingItems.count + 1,
          },
        });
      },
    });

    await refetch();

    return result;
  } catch (error) {
    client.writeQuery({
      query,
      variables,
      data: existingItems,
    });
    throw error;
  }
};
