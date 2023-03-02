async function addToCart(
  root,
  { channelId, image, name, price, productId, variantId, quantity, orderId },
  context
) {
  console.log("ADDING TO CART!");
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  // 2. Query the current users cart
  const allCartItems = await context.query.CartItem.findMany({
    where: {
      order: { id: { equals: orderId } },
      channel: { id: { equals: channelId } },
      user: { id: { equals: sesh.itemId } },
      productId: { equals: productId },
      variantId: { equals: variantId },
      status: { not: { equals: "CANCELLED" } },
      purchaseId: { equals: "" } ,
      url: { equals: "" } ,
    },
    query: "id quantity",
  });

  const [existingCartItem] = allCartItems;
  if (existingCartItem) {
    console.log(
      `There are already ${existingCartItem.quantity}, increment by 1!`
    );

    const updatedCartItem = await context.query.CartItem.updateOne({
      where: { id: existingCartItem.id },
      data: {
        quantity: existingCartItem.quantity + parseInt(quantity),
      },
    });

    return await context.db.Order.findOne({
      where: {
        id: orderId,
      },
    });
  }

  const result = await context.query.CartItem.createOne({
    data: {
      price,
      productId,
      variantId,
      quantity: parseInt(quantity),
      image,
      name,
      user: { connect: { id: sesh.itemId } },
      order: { connect: { id: orderId } },
      channel: { connect: { id: channelId } },
    },
  });

  console.log({ result });

  return await context.db.Order.findOne({
    where: {
      id: orderId,
    },
  });
}

export default addToCart;
