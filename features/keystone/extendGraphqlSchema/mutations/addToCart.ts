import type { KeystoneContext } from '@keystone-6/core/types';

interface AddToCartArgs {
  channelId: string;
  image?: string;
  name: string;
  price: string;
  productId: string;
  variantId: string;
  quantity: string;
  orderId: string;
}

async function addToCart(
  root: any,
  { channelId, image, name, price, productId, variantId, quantity, orderId }: AddToCartArgs,
  context: KeystoneContext
) {
  // 1. Query the current user see if they are signed in
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // 2. Query the current users cart
  const allCartItems = await context.query.CartItem.findMany({
    where: {
      order: { id: { equals: orderId } },
      channel: { id: { equals: channelId } },
      user: { id: { equals: session.itemId } },
      productId: { equals: productId },
      variantId: { equals: variantId },
      status: { not: { equals: "CANCELLED" } },
      purchaseId: { equals: "" },
      url: { equals: "" },
    },
    query: "id quantity",
  });

  const [existingCartItem] = allCartItems;
  if (existingCartItem) {
    console.log(
      `There are already ${existingCartItem.quantity}, increment by 1!`
    );

    await context.query.CartItem.updateOne({
      where: { id: existingCartItem.id },
      data: {
        quantity: existingCartItem.quantity + parseInt(quantity, 10),
      },
    });

    return await context.db.Order.findOne({
      where: {
        id: orderId,
      },
    });
  }

  await context.query.CartItem.createOne({
    data: {
      price: price,
      productId,
      variantId,
      quantity: parseInt(quantity, 10),
      image,
      name,
      user: { connect: { id: session.itemId } },
      order: { connect: { id: orderId } },
      channel: { connect: { id: channelId } },
    },
  });

  return await context.db.Order.findOne({
    where: {
      id: orderId,
    },
  });
}

export default addToCart;