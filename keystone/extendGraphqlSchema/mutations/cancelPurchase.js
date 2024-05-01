async function cancelPurchase(root, { purchaseId }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const cartItemIDs = await context.query.CartItem.findMany({
    where: {
      purchaseId: { equals: purchaseId },
    },
  });

  console.log({ cartItemIDs });

  const updatedCartItems = await context.query.CartItem.updateMany({
    data: cartItemIDs.map(({ id }) => ({
      where: { id },
      data: { status: "CANCELLED" },
    })),
    query: `id order { id }`,
  });

  console.log({ updatedCartItems });

  const order = await context.query.Order.updateOne({
    where: { id: updatedCartItems[0].order.id },
    data: {
      status: "PENDING",
    },
  });

  return "Operation successful";
}

export default cancelPurchase;
