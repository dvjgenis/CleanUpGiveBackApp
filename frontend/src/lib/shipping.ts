import { STANDARD_SHIPPING_FEE } from '@/constants/commerce';
import type { CartLineItem } from '@/features/figma-screens/mocks/cart';
import type { FulfillmentMethod } from '@/lib/shopOrders';

/** Computes the numeric shipping charge for a shop-cart checkout.
 *  Tracker-bundle checkout does not use this helper — that path is always free. */
export function computeShippingFee(
  items: readonly CartLineItem[],
  fulfillmentMethod: FulfillmentMethod,
): number {
  if (fulfillmentMethod !== 'usps_ship') return 0;
  if (items.length === 0) return 0;
  return STANDARD_SHIPPING_FEE;
}

export function shippingFeeLabel(fee: number): string {
  return fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`;
}
