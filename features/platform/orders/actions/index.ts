'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "../../../dashboard/lib/keystoneClient";

// Interface for order data (exported for potential use in other files)
export interface Order {
  id: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Get list of orders
 */
export async function getOrders(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }],
  selectedFields: string = `
    id orderId orderName email firstName lastName streetAddress1 streetAddress2 city state zip country phone currency totalPrice subTotalPrice totalDiscounts totalTax status error createdAt updatedAt user { id name email } shop { id name domain accessToken } lineItems { id name image price quantity productId variantId sku lineItemId } cartItems { id name image price quantity productId variantId sku purchaseId url error channel { id name } }
  `
) {
  const query = `
    query GetOrders($where: OrderWhereInput, $take: Int!, $skip: Int!, $orderBy: [OrderOrderByInput!]) {
      items: orders(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        ${selectedFields}
      }
      count: ordersCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, {
    where,
    take,
    skip,
    orderBy,
  });

  if (response.success) {
    return {
      success: true,
      data: {
        items: response.data.items || [],
        count: response.data.count || 0,
      },
    };
  } else {
    console.error('Error fetching orders:', response.error);
    return {
      success: false,
      error: response.error || 'Failed to fetch orders',
      data: { items: [], count: 0 },
    };
  }
}

/**
 * Get filtered orders with search and pagination
 */
export async function getFilteredOrders(
  status?: string,
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  sort?: string
) {
  // Build where clause
  const where: Record<string, any> = {};
  
  // Status filtering
  if (status && status !== 'all') {
    where.status = { equals: status };
  }
  
  // Search filtering (adjust fields as needed)
  if (search?.trim()) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      // Add more searchable fields as needed
    ];
  }

  // Build orderBy clause
  let orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }];
  if (sort) {
    if (sort.startsWith('-')) {
      const field = sort.substring(1);
      orderBy = [{ [field]: 'desc' }];
    } else {
      orderBy = [{ [sort]: 'asc' }];
    }
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  try {
    const result = await getOrders(where, pageSize, skip, orderBy);
    return result;
  } catch (error: any) {
    console.error('Error in getFilteredOrders:', error);
    return {
      success: false,
      error: error.message || 'Failed to get filtered orders',
      data: { items: [], count: 0 },
    };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(id: string) {
  const query = `
    query GetOrder($id: ID!) {
      order(where: { id: $id }) {
        id orderId orderName email firstName lastName streetAddress1 streetAddress2 city state zip country phone currency totalPrice subTotalPrice totalDiscounts totalTax status error createdAt updatedAt user { id name email } shop { id name domain accessToken } lineItems { id name image price quantity productId variantId sku lineItemId } cartItems { id name image price quantity productId variantId sku purchaseId url error channel { id name } }
      }
    }
  `;

  const response = await keystoneClient(query, { id });

  if (response.success) {
    if (!response.data.order) {
      return {
        success: false,
        error: 'Order not found',
        data: null,
      };
    }

    return {
      success: true,
      data: response.data.order,
    };
  } else {
    console.error('Error fetching order:', response.error);
    return {
      success: false,
      error: response.error || 'Failed to fetch order',
      data: null,
    };
  }
}

/**
 * Get order status counts for StatusTabs
 */
export async function getOrderStatusCounts() {
  const statusKeys = ["PENDING","INPROCESS","AWAITING","BACKORDERED","CANCELLED","COMPLETE"];
  
  const statusQueries = statusKeys.map(status => 
    `${status}: ordersCount(where: { status: { equals: "${status}" } })`
  ).join('\n      ');
  
  const query = `
    query GetOrderStatusCounts {
      ${statusQueries}
      all: ordersCount
    }
  `;

  const response = await keystoneClient(query);

  if (response.success) {
    const counts: Record<string, number> = {
      all: response.data.all || 0,
    };
    
    statusKeys.forEach(status => {
      counts[status] = response.data[status] || 0;
    });
    
    return {
      success: true,
      data: counts,
    };
  } else {
    console.error('Error fetching order status counts:', response.error);
    const emptyCounts: Record<string, number> = {
      all: 0,
    };
    
    statusKeys.forEach(status => {
      emptyCounts[status] = 0;
    });
    
    return {
      success: false,
      error: response.error || 'Failed to fetch order status counts',
      data: emptyCounts,
    };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, status: string) {
  const mutation = `
    mutation UpdateOrderStatus($id: ID!, $data: OrderUpdateInput!) {
      updateOrder(where: { id: $id }, data: $data) {
        id
        status
      }
    }
  `;

  const response = await keystoneClient(mutation, {
    id,
    data: { status },
  });

  if (response.success) {
    // Revalidate the order page to reflect the status change
    revalidatePath(`/dashboard/platform/orders/${id}`);
    revalidatePath('/dashboard/platform/orders');

    return {
      success: true,
      data: response.data.updateOrder,
    };
  } else {
    console.error('Error updating order status:', response.error);
    return {
      success: false,
      error: response.error || 'Failed to update order status',
      data: null,
    };
  }
}

/**
 * Get all channels
 */
export async function getChannels() {
  const query = `
    query GetChannels {
      channels {
        id
        name
      }
    }
  `;
  const response = await keystoneClient(query);
  return response.data?.channels || [];
}
