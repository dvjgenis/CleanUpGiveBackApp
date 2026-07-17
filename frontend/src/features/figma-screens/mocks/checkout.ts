/**
 * Checkout mocks — Figma `shop_checkout_final` (`657:1809` / PRD §6.23).
 * Builds order summary from live cart items (+ cart donation).
 */

import {
  DEFAULT_CART_ITEMS,
  DEFAULT_CART_SUMMARY,
  DEFAULT_DONATION,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  donationValue,
  formatUsd,
  type CartDonationAmount,
  type CartLineItem,
} from './cart';

export interface CheckoutOrderLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: number;
}

export interface CheckoutSummary {
  lines: CheckoutOrderLine[];
  itemCount: number;
  subtotal: number;
  donation: number;
  shippingLabel: string;
  tax: number;
  total: number;
}

export function getCheckoutSummary(
  items: CartLineItem[],
  donation: CartDonationAmount | null = DEFAULT_DONATION,
): CheckoutSummary {
  const donationAmount = donationValue(donation);
  const tax = items.length > 0 ? DEFAULT_CART_SUMMARY.tax : 0;
  return {
    lines: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
      image: item.image,
    })),
    itemCount: cartItemCount(items),
    subtotal: cartSubtotal(items),
    donation: donationAmount,
    shippingLabel: DEFAULT_CART_SUMMARY.shippingLabel,
    tax,
    total: cartTotal(items, donation, tax),
  };
}

/** Fallback summary from default mock cart (tests / legacy). */
export function getDefaultCheckoutSummary(): CheckoutSummary {
  return getCheckoutSummary(DEFAULT_CART_ITEMS);
}

const TRACKER_ACCESS_PRICE = 49.99;

/** Fixed one-time tracker payment shown after the free hour expires. */
export function getTrackerCheckoutSummary(): CheckoutSummary {
  return {
    lines: [
      {
        id: 'tracker-access',
        name: 'Tracking access (one-time)',
        quantity: 1,
        unitPrice: TRACKER_ACCESS_PRICE,
        lineTotal: TRACKER_ACCESS_PRICE,
        image: 0,
      },
    ],
    itemCount: 1,
    subtotal: TRACKER_ACCESS_PRICE,
    donation: 0,
    shippingLabel: 'Included',
    tax: 0,
    total: TRACKER_ACCESS_PRICE,
  };
}

export { formatUsd };
