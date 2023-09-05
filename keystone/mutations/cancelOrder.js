async function cancelOrder(root, { purchaseId }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const [foundOrder] = await query.Order.findMany({
    where: {
      orderId: { equals: orderId },
    },
  });

  const updatedOrder = await query.Order.updateOne({
    where: { id: foundOrder },
    data: { status: "CANCELLED" },
  });

  return "Operation successful";
}

export default cancelOrder;
