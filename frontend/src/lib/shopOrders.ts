/**
 * Shop orders integration with Supabase database.
 * Handles creating and managing shop orders from the mobile checkout flow.
 */

import { supabase, getUserId } from './supabase';
import type { CartLineItem, CartDonationAmount } from '@/features/figma-screens/mocks/cart';

export type ShippingInfo = {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type OrderCreateRequest = {
  items: CartLineItem[];
  donation: CartDonationAmount | null;
  shipping: ShippingInfo;
  tax: number;
};

export type OrderCreateResult = {
  orderId: string;
  success: true;
} | {
  success: false;
  error: string;
};

/**
 * Creates a new shop order in the database.
 * This will be called when the user taps "Place Order" in the checkout flow.
 */
export async function createShopOrder(request: OrderCreateRequest): Promise<OrderCreateResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Database not configured'
      };
    }

    // Get the current user ID (anonymous auth)
    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Unable to identify user'
      };
    }

    // Transform cart items to database format
    const itemsJson = request.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      qty: item.quantity,
      quantity: item.quantity, // Alias for compatibility
      unitCents: Math.round(item.unitPrice * 100),
      unit_cents: Math.round(item.unitPrice * 100), // Alias for compatibility
    }));

    // Add donation as a line item if present
    if (request.donation && typeof request.donation === 'number') {
      itemsJson.push({
        id: 'donation',
        name: 'Donation',
        description: 'Support our cleanup efforts',
        qty: 1,
        quantity: 1,
        unitCents: request.donation * 100,
        unit_cents: request.donation * 100,
      });
    }

    // Calculate total in cents
    const subtotalCents = request.items.reduce((sum, item) => 
      sum + Math.round(item.unitPrice * item.quantity * 100), 0
    );
    const donationCents = (typeof request.donation === 'number') ? request.donation * 100 : 0;
    const taxCents = Math.round(request.tax * 100);
    const totalCents = subtotalCents + donationCents + taxCents;

    // Transform shipping info to database format
    const shippingAddress = {
      name: request.shipping.fullName,
      line1: request.shipping.street,
      line2: null,
      city: request.shipping.city,
      state: request.shipping.state,
      postalCode: request.shipping.zip,
      postal_code: request.shipping.zip, // Alias for compatibility
      zip: request.shipping.zip, // Alias for compatibility
      country: 'US',
      phone: null, // Not collected in current checkout form
    };

    // Insert the order
    const { data, error } = await supabase
      .from('shop_orders')
      .insert({
        user_id: userId,
        items: itemsJson,
        total_cents: totalCents,
        status: 'pending', // Orders start as pending
        shipping_address: shippingAddress,
        tracking_number: null,
        carrier: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[shopOrders] Failed to create order:', error);
      return {
        success: false,
        error: `Failed to create order: ${error.message}`
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error: 'Order created but no ID returned'
      };
    }

    console.log('[shopOrders] Order created successfully:', data.id);
    return {
      success: true,
      orderId: data.id
    };

  } catch (error) {
    console.error('[shopOrders] Unexpected error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    };
  }
}

/**
 * Get orders for the current user (for order history, etc.)
 */
export async function getUserOrders() {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured', orders: [] };
    }

    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'Unable to identify user', orders: [] };
    }

    const { data, error } = await supabase
      .from('shop_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[shopOrders] Failed to fetch orders:', error);
      return { success: false, error: error.message, orders: [] };
    }

    return { success: true, error: null, orders: data || [] };

  } catch (error) {
    console.error('[shopOrders] Unexpected error fetching orders:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unexpected error occurred', 
      orders: [] 
    };
  }
}