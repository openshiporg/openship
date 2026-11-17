type SourceLineItem = { lineItemId: string; quantity: number };

type AddTracking = (args: {
  platform: any;
  order: any;
  trackingCompany: string;
  trackingNumber: string;
  lineItems: SourceLineItem[];
}) => Promise<unknown>;

export async function relaySourceTrackingForDetail(
  context: any,
  trackingDetailId: string,
  addTracking?: AddTracking
): Promise<void> {
  const sudoContext = context.sudo();
  const seed = await sudoContext.query.TrackingDetail.findOne({
    where: { id: trackingDetailId },
    query: `
      id trackingNumber trackingCompany fulfillmentLineItems relayedAt
      cartItems { id quantity lineItemId productId variantId order { id } }
    `,
  });
  if (!seed) throw new Error('Tracking detail not found');

  const orderIds = new Set(
    (seed.cartItems || []).map((item: any) => item.order?.id).filter(Boolean)
  );
  if (orderIds.size !== 1) {
    throw new Error('Tracking detail must belong to exactly one source order');
  }
  const orderId = [...orderIds][0] as string;

  const order = await sudoContext.query.Order.findOne({
    where: { id: orderId },
    query: `
      id orderId orderName status
      shop {
        id domain accessToken
        platform { id name addTrackingFunction }
      }
      lineItems { id lineItemId productId variantId }
      cartItems {
        id status quantity
        trackingDetails { id fulfillmentLineItems relayedAt }
      }
    `,
  });
  if (!order) throw new Error('Source order not found');
  // The shop cancelled this order: keep the tracking on file, but do not send
  // it to the shop or mark the order complete.
  if (order.status === 'CANCELLED') return;

  const allocationByCartItem = new Map<string, number>(
    (Array.isArray(seed.fulfillmentLineItems) ? seed.fulfillmentLineItems : []).map(
      (allocation: any) => [String(allocation.cartItemId), Number(allocation.quantity)]
    )
  );
  const lineItems = [] as SourceLineItem[];
  for (const item of seed.cartItems || []) {
    const trackingQuantity = allocationByCartItem.size
      ? allocationByCartItem.get(String(item.id))
      : Number(item.quantity);
    if (!Number.isInteger(trackingQuantity) || Number(trackingQuantity) <= 0) {
      throw new Error(`Cart item ${item.id} has an invalid tracking quantity`);
    }
    let sourceLineItemId = String(item.lineItemId || '').trim();
    if (!sourceLineItemId) {
      const matches = (order.lineItems || []).filter(
        (line: any) => line.productId === item.productId && line.variantId === item.variantId
      );
      if (matches.length !== 1 || !matches[0].lineItemId) {
        throw new Error(`Cart item ${item.id} cannot be mapped to a source order line`);
      }
      sourceLineItemId = String(matches[0].lineItemId);
      await sudoContext.query.CartItem.updateOne({
        where: { id: item.id },
        data: { lineItemId: sourceLineItemId },
        query: 'id',
      });
    }
    lineItems.push({ lineItemId: sourceLineItemId, quantity: Number(trackingQuantity) });
  }
  if (!lineItems.length) throw new Error('Tracking detail has no source order lines');
  if (!order?.shop?.platform?.addTrackingFunction) {
    throw new Error('Source shop tracking relay is not configured');
  }

  const relay = addTracking || (await import('../shop/lib/executor')).addShopTracking;
  await relay({
    platform: {
      ...order.shop.platform,
      domain: order.shop.domain,
      accessToken: order.shop.accessToken,
    },
    order,
    trackingCompany: seed.trackingCompany,
    trackingNumber: seed.trackingNumber,
    lineItems,
  });

  await sudoContext.query.TrackingDetail.updateOne({
    where: { id: seed.id },
    data: { relayedAt: new Date().toISOString() },
    query: 'id',
  });

  // A CartItem is complete only when successfully relayed allocations cover its
  // full quantity. Persisted-but-failed TrackingDetails do not count.
  const completedCartItemIds = new Set<string>();
  for (const item of order.cartItems || []) {
    if (item.status === 'CANCELLED') continue;
    let relayedQuantity = 0;
    for (const detail of item.trackingDetails || []) {
      const isCurrent = detail.id === seed.id;
      if (!detail.relayedAt && !isCurrent) continue;
      const allocations = Array.isArray(detail.fulfillmentLineItems)
        ? detail.fulfillmentLineItems
        : [];
      if (!allocations.length) {
        relayedQuantity += Number(item.quantity || 0);
        continue;
      }
      relayedQuantity += allocations
        .filter((allocation: any) => String(allocation.cartItemId) === String(item.id))
        .reduce((sum: number, allocation: any) => sum + Number(allocation.quantity || 0), 0);
    }
    if (relayedQuantity >= Number(item.quantity || 0)) {
      completedCartItemIds.add(String(item.id));
      await sudoContext.query.CartItem.updateOne({
        where: { id: item.id },
        data: { status: 'COMPLETE', error: '' },
        query: 'id',
      });
    }
  }

  const activeCartItems = (order.cartItems || []).filter(
    (item: any) => item.status !== 'CANCELLED'
  );
  if (
    activeCartItems.length > 0 &&
    activeCartItems.every((item: any) => completedCartItemIds.has(String(item.id)))
  ) {
    await sudoContext.query.Order.updateOne({
      where: { id: order.id },
      data: { status: 'COMPLETE', error: '' },
      query: 'id',
    });
  }
}
