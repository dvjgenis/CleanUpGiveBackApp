/**
 * Purchase confirmation mocks — Figma `shop_confirmation` (`494:262` / PRD §6.24).
 * Also reused for Contribute donation confirmation (`?mode=donation`).
 */

import { getCartDonation, getCartItems } from '../cartStore';
import { getCheckoutSummary, getTrackerCheckoutSummary, formatUsd, type CheckoutOrderLine } from './checkout';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const PURCHASE_CONFIRMATION_ASSETS = {
  kitThumb: require('@/assets/figma/shop/confirmation/kit-thumb.png') as number,
};

export type PurchaseConfirmationMode = 'order' | 'donation' | 'tracker';

export interface PurchaseConfirmationDetail {
  label: string;
  value: string;
}

export interface PurchaseConfirmationData {
  mode: PurchaseConfirmationMode;
  lines: CheckoutOrderLine[];
  donationAmount: number;
  details: PurchaseConfirmationDetail[];
  totalImpact: number;
}

function getNow(): { date: string; time: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return {
    date: `${month}/${day}/${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
}

function getSharedPaymentDetails(): PurchaseConfirmationDetail[] {
  const { date, time } = getNow();
  return [
    { label: 'Date', value: date },
    { label: 'Time', value: time },
    { label: 'Payment Method', value: 'Visa Credit Card' },
  ];
}

export function getPurchaseConfirmationFromCart(): PurchaseConfirmationData {
  const items = getCartItems();
  const summary = getCheckoutSummary(items, getCartDonation());
  return {
    mode: 'order',
    lines: summary.lines,
    donationAmount: summary.donation,
    details: [
      ...getSharedPaymentDetails(),
      { label: 'Taxes', value: formatUsd(summary.tax) },
      { label: 'Shipping', value: summary.shippingLabel },
    ],
    totalImpact: summary.total,
  };
}

/** Tracker one-time payment — Continue on `FreeTrialModal` → Checkout `?mode=tracker`. */
export function getTrackerPurchaseConfirmation(): PurchaseConfirmationData {
  const summary = getTrackerCheckoutSummary();
  return {
    mode: 'tracker',
    lines: summary.lines,
    donationAmount: 0,
    details: [
      ...getSharedPaymentDetails(),
      { label: 'Estimated Shipping', value: '~2-3 days' },
    ],
    totalImpact: summary.total,
  };
}

/** Donate / Contribute flow — donation-only receipt. */
export function getDonationConfirmation(amount: number): PurchaseConfirmationData {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return {
    mode: 'donation',
    lines: [],
    donationAmount: safeAmount,
    details: getSharedPaymentDetails(),
    totalImpact: safeAmount,
  };
}

export function parseDonationAmountParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** @deprecated Prefer `getPurchaseConfirmationFromCart`. */
export function getDefaultPurchaseConfirmation(): PurchaseConfirmationData {
  return getPurchaseConfirmationFromCart();
}

export { formatUsd };
