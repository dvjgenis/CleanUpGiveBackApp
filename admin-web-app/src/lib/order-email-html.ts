/**
 * Figma `1311:359` Order Shipped / order-placed email HTML.
 *
 * Table + inline CSS only — Gmail/Outlook strip `<style>` blocks, SVG, and
 * webfonts. Sanchez is headline + Track Order only. All other copy is Noto
 * Sans: static chrome/labels are rasterized PNGs (Gmail); dynamic fields use
 * hosted `@font-face` with Arial fallback. Shipped body has two Noto PNGs:
 * 16px laptop wrap and 20px ~288px phone wrap, both left-aligned (`@media` swap so type does
 * not shrink with the 600px shell).
 * Placeholder-first: each field uses Figma sample copy until a real
 * `shop_orders` / volunteer value is present. Do not invent missing data.
 *
 * Keep in sync with `backend/sessions/src/lib/order-email-html.ts`.
 */

export type OrderEmailVariant = 'placed' | 'shipped';

export type OrderEmailLineItem = {
  id?: string | null;
  name?: string | null;
  qty?: number | null;
  unitCents?: number | null;
};

export type OrderEmailAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type OrderEmailInput = {
  variant: OrderEmailVariant;
  volunteerName?: string | null;
  orderId?: string | null;
  createdAt?: string | Date | null;
  totalCents?: number | null;
  paymentMethod?: string | null;
  shippingAddress?: OrderEmailAddress | null;
  items?: OrderEmailLineItem[] | null;
  trackingNumber?: string | null;
  carrier?: string | null;
};

export const ORDER_EMAIL_PLACEHOLDERS = {
  volunteerName: 'Alex Johnson',
  orderNumberHeader: 'X-XXXX',
  address: 'XXXXX, XXXXX, XX XXXXX',
  paymentMethod: '—',
  orderTotal: '$XX.XXX',
  orderNumberSummary: '######',
  orderDate: 'MM/DD/YYYY',
  itemName: 'Product Item',
  itemQty: 'X',
  itemPrice: '$23.99',
  itemsTotal: '$50.00',
} as const;

export const ORDER_EMAIL_SUBJECTS: Record<OrderEmailVariant, string> = {
  placed: 'Thank you for your order!',
  shipped: 'Your order is on its way!',
};

/** Hosted on the production admin deploy — Resend needs a public image URL. */
export const ORDER_EMAIL_ASSET_BASE = 'https://cleanupgiveback-web-app.vercel.app/email';

const SUPPORT_EMAIL = 'donnaadam@cleanupgiveback.org';

const PRODUCT_IMAGE_BY_ID: Record<string, string> = {
  'cleanup-kit': `${ORDER_EMAIL_ASSET_BASE}/cleanup-kit.png`,
  'trash-grabber': `${ORDER_EMAIL_ASSET_BASE}/trash-grabber.png`,
  'tote-bags': `${ORDER_EMAIL_ASSET_BASE}/tote-bags.png`,
  'adult-safety-vest': `${ORDER_EMAIL_ASSET_BASE}/adult-safety-vest.png`,
  'child-safety-vest': `${ORDER_EMAIL_ASSET_BASE}/child-safety-vest.png`,
};

const PLACEHOLDER_IMAGE = `${ORDER_EMAIL_ASSET_BASE}/product-placeholder.png`;
const LOGO_MARK_URL = `${ORDER_EMAIL_ASSET_BASE}/logo-mark.png`;
const SHIPPING_ICON_URL = `${ORDER_EMAIL_ASSET_BASE}/shipping.gif?v=4`;
const HEADLINE_URL = `${ORDER_EMAIL_ASSET_BASE}/order-on-its-way-headline.png?v=2`;
const TRACK_ORDER_URL = `${ORDER_EMAIL_ASSET_BASE}/track-order-button.png`;
const PLACED_BODY_URL = `${ORDER_EMAIL_ASSET_BASE}/order-placed-body.png`;
const PLACED_BODY_MOBILE_URL = `${ORDER_EMAIL_ASSET_BASE}/order-placed-body-mobile.png`;
const SHIPPED_BODY_URL = `${ORDER_EMAIL_ASSET_BASE}/order-shipped-body.png?v=2`;
const SHIPPED_BODY_MOBILE_URL = `${ORDER_EMAIL_ASSET_BASE}/order-shipped-body-mobile.png?v=2`;
const SUPPORT_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-support.png`;
const SUPPORT_MOBILE_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-support-mobile.png`;
const CONTACT_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-contact-us.png`;
const PRIVACY_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-privacy.png`;
const UNSUBSCRIBE_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-unsubscribe.png`;
const NONPROFIT_URL = `${ORDER_EMAIL_ASSET_BASE}/forgot-password-nonprofit.png`;
const FONT_REGULAR_URL = `${ORDER_EMAIL_ASSET_BASE}/fonts/NotoSans-Regular.ttf`;
const FONT_BOLD_URL = `${ORDER_EMAIL_ASSET_BASE}/fonts/NotoSans-Bold.ttf`;
const EMAIL_SANS = "'Noto Sans',Arial,Helvetica,sans-serif";
const SUPPORT_ALT = `Please do not reply to this email. For customer service, email ${SUPPORT_EMAIL}`;

const PLACEHOLDER_LINE_ITEMS: OrderEmailLineItem[] = [
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
  { name: ORDER_EMAIL_PLACEHOLDERS.itemName, qty: null, unitCents: null },
];

export function resolveOrderEmailField(
  realValue: string | null | undefined,
  placeholder: string,
): string {
  const trimmed = realValue?.trim();
  return trimmed ? trimmed : placeholder;
}

export function trackingUrl(carrier: string | null | undefined, tracking: string | null | undefined): string | null {
  const code = tracking?.trim();
  const c = carrier?.trim().toLowerCase();
  if (!code || !c) return null;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(code)}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}`;
  if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(code)}`;
  return null;
}

export function formatOrderDisplayId(orderId: string | null | undefined): string | null {
  if (!orderId?.trim()) return null;
  const compact = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return compact.length >= 4 ? compact : null;
}

export function formatUsdFromCents(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatOrderDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

const ADDRESS_SENTINELS = new Set(['address not provided', '—', '-', 'n/a', 'na', 'none', 'unknown', 'tbd']);

function usableAddressPart(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (ADDRESS_SENTINELS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function formatShippingAddress(addr: OrderEmailAddress | null | undefined): string | null {
  if (!addr) return null;
  const line1 = usableAddressPart(addr.line1);
  const city = usableAddressPart(addr.city);
  if (!line1 || !city) return null;
  const cityLine = [city, usableAddressPart(addr.state), usableAddressPart(addr.postalCode)].filter(Boolean).join(', ');
  const countryRaw = usableAddressPart(addr.country);
  const countryUpper = countryRaw?.toUpperCase();
  const country = !countryRaw || countryUpper === 'US' || countryUpper === 'USA' ? 'USA' : countryRaw;
  return [line1, usableAddressPart(addr.line2), cityLine, country].filter(Boolean).join(', ');
}

export function parseShopOrderItems(items: unknown): OrderEmailLineItem[] {
  if (!Array.isArray(items)) return [];
  const rows: OrderEmailLineItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const qtyRaw = row.qty ?? row.quantity;
    const centsRaw = row.unitCents ?? row.unit_cents ?? row.price;
    rows.push({
      id: typeof row.id === 'string' ? row.id : null,
      name: typeof row.name === 'string' ? row.name : null,
      qty: typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw) || null,
      unitCents: typeof centsRaw === 'number' ? centsRaw : Number(centsRaw) || null,
    });
  }
  return rows;
}

export function parseShopOrderAddress(shippingData: unknown): OrderEmailAddress | null {
  if (!shippingData || typeof shippingData !== 'object') return null;
  const row = shippingData as Record<string, unknown>;
  const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);
  return {
    name: str(row.name),
    line1: str(row.line1) ?? str(row.address),
    line2: str(row.line2),
    city: str(row.city),
    state: str(row.state),
    postalCode: str(row.postalCode) ?? str(row.postal_code) ?? str(row.zip),
    country: str(row.country),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function typePng(file: string, width: number, height: number, alt: string, extra = ''): string {
  return `<img src="${ORDER_EMAIL_ASSET_BASE}/${file}" width="${width}" height="${height}" alt="${escapeHtml(alt)}" style="display:block;border:0;width:${width}px;height:${height}px;${extra}">`;
}

function bodyCopyHtml(
  desktopUrl: string,
  desktopWidth: number,
  desktopHeight: number,
  mobileUrl: string,
  mobileWidth: number,
  mobileHeight: number,
  alt: string,
): string {
  const safeAlt = escapeHtml(alt);
  return `<table role="presentation" class="oe-body-desktop" cellpadding="0" cellspacing="0" align="left" width="100%">
              <tr>
                <td align="left" style="text-align:left;">
                  <img src="${desktopUrl}" width="${desktopWidth}" height="${desktopHeight}" alt="${safeAlt}" style="display:block;border:0;margin:0 0 32px;max-width:100%;height:auto;">
                </td>
              </tr>
            </table>
            <table role="presentation" class="oe-body-mobile" cellpadding="0" cellspacing="0" align="left" width="100%" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
              <tr>
                <td align="left" style="text-align:left;">
                  <img src="${mobileUrl}" width="${mobileWidth}" height="${mobileHeight}" alt="${safeAlt}" style="display:block;border:0;margin:0 0 32px;width:${mobileWidth}px;height:auto;max-width:100%;">
                </td>
              </tr>
            </table>`;
}

function productImageUrl(productId: string | null | undefined): string {
  if (!productId) return PLACEHOLDER_IMAGE;
  return PRODUCT_IMAGE_BY_ID[productId] ?? PLACEHOLDER_IMAGE;
}

function lineItemRowsHtml(items: OrderEmailLineItem[]): string {
  return items
    .map((item) => {
      const name = resolveOrderEmailField(item.name, ORDER_EMAIL_PLACEHOLDERS.itemName);
      const qty =
        item.qty != null && Number.isFinite(item.qty) && item.qty > 0
          ? String(item.qty)
          : ORDER_EMAIL_PLACEHOLDERS.itemQty;
      const lineCents =
        item.unitCents != null && item.qty != null && item.qty > 0 ? item.unitCents * item.qty : item.unitCents;
      const price = formatUsdFromCents(lineCents) ?? ORDER_EMAIL_PLACEHOLDERS.itemPrice;
      const img = productImageUrl(item.id);
      return `<tr>
  <td style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td width="86" style="width:86px;vertical-align:middle;">
          <img src="${img}" width="86" height="86" alt="" style="display:block;width:86px;height:86px;object-fit:cover;border:0;">
        </td>
        <td style="padding-left:16px;vertical-align:middle;font-family:${EMAIL_SANS};font-size:16px;font-weight:bold;color:#000000;">${escapeHtml(name)}</td>
      </tr>
    </table>
  </td>
  <td align="center" width="48" style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;font-family:${EMAIL_SANS};font-size:14px;color:#000000;">${escapeHtml(qty)}</td>
  <td align="right" width="72" style="padding:16px 0;border-bottom:1px solid #e5e2e1;vertical-align:middle;font-family:${EMAIL_SANS};font-size:16px;color:#ba1a1a;white-space:nowrap;">${escapeHtml(price)}</td>
</tr>`;
    })
    .join('');
}

export function buildOrderEmailHtml(input: OrderEmailInput): string {
  const volunteerName = resolveOrderEmailField(input.volunteerName, ORDER_EMAIL_PLACEHOLDERS.volunteerName);
  const displayId = formatOrderDisplayId(input.orderId);
  const orderNumberHeader = resolveOrderEmailField(displayId, ORDER_EMAIL_PLACEHOLDERS.orderNumberHeader);
  const orderNumberSummary = resolveOrderEmailField(displayId, ORDER_EMAIL_PLACEHOLDERS.orderNumberSummary);
  const address = resolveOrderEmailField(
    formatShippingAddress(input.shippingAddress),
    ORDER_EMAIL_PLACEHOLDERS.address,
  );
  const paymentMethod = resolveOrderEmailField(input.paymentMethod, ORDER_EMAIL_PLACEHOLDERS.paymentMethod);
  const orderTotal = resolveOrderEmailField(
    formatUsdFromCents(input.totalCents),
    ORDER_EMAIL_PLACEHOLDERS.orderTotal,
  );
  const orderDate = resolveOrderEmailField(formatOrderDate(input.createdAt), ORDER_EMAIL_PLACEHOLDERS.orderDate);

  const realItems = (input.items ?? []).filter((item) => item.name?.trim() || (item.unitCents != null && item.unitCents > 0));
  const items = realItems.length > 0 ? realItems : PLACEHOLDER_LINE_ITEMS;
  const itemsTotal =
    realItems.length > 0
      ? resolveOrderEmailField(formatUsdFromCents(input.totalCents), ORDER_EMAIL_PLACEHOLDERS.itemsTotal)
      : ORDER_EMAIL_PLACEHOLDERS.itemsTotal;

  const isShipped = input.variant === 'shipped';
  const headline = 'Your order is on its way!';
  const greeting = `Thank you for your order, ${volunteerName}!`;
  const bodyCopy = isShipped
    ? 'Your package is on its way and will arrive soon! Please wait 24 hours to start tracking your order.'
    : "We've received your order and will email you when it ships.";

  const trackHref = isShipped ? trackingUrl(input.carrier, input.trackingNumber) : null;
  const ctaHtml = trackHref
    ? `<tr><td align="center" style="padding-top:12px;">
        <a href="${escapeHtml(trackHref)}" style="display:inline-block;line-height:0;text-decoration:none;">
          <img src="${TRACK_ORDER_URL}" width="180" height="45" alt="Track Order" style="display:block;border:0;width:180px;height:45px;">
        </a>
      </td></tr>`
    : '';
  const bodyHtml = isShipped
    ? bodyCopyHtml(SHIPPED_BODY_URL, 523, 42, SHIPPED_BODY_MOBILE_URL, 288, 92, bodyCopy)
    : bodyCopyHtml(PLACED_BODY_URL, 452, 24, PLACED_BODY_MOBILE_URL, 292, 45, bodyCopy);

  const summaryRow = (file: string, width: number, height: number, label: string, value: string) =>
    `<tr>
      <td style="padding:0 0 20px;vertical-align:top;width:140px;">${typePng(file, width, height, label)}</td>
      <td style="padding:0 0 20px;font-family:${EMAIL_SANS};font-size:14px;font-weight:bold;color:#1c1b1b;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(headline)}</title>
  <style type="text/css">
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 400;
      src: url('${FONT_REGULAR_URL}') format('truetype');
    }
    @font-face {
      font-family: 'Noto Sans';
      font-style: normal;
      font-weight: 700;
      src: url('${FONT_BOLD_URL}') format('truetype');
    }
    @media only screen and (max-width: 600px) {
      .shipping-gif-cell {
        padding-right: 36px !important;
      }
      .oe-body-desktop,
      .oe-support-desktop {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
      }
      .oe-body-mobile,
      .oe-support-mobile {
        display: table !important;
        width: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fcf9f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fcf9f8;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;font-family:${EMAIL_SANS};">
        <tr>
          <td style="background-color:#009540;padding:16px 20px 32px;">
            <img src="${LOGO_MARK_URL}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="shipping-gif-cell" align="center" style="padding-top:0;padding-right:24px;font-size:0;line-height:0;">
                  <img src="${SHIPPING_ICON_URL}" width="220" height="106" alt="" style="display:block;width:220px;height:106px;border:0;margin:0 auto;">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:4px;font-size:0;line-height:0;">
                  <img src="${HEADLINE_URL}" width="340" height="36" alt="${escapeHtml(headline)}" style="display:block;border:0;margin:0 auto;width:340px;height:36px;max-width:100%;height:auto;">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:10px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td style="vertical-align:middle;">${typePng('order-number-prefix.png', 102, 14, 'Order number:')}</td>
                      <td style="padding-left:6px;vertical-align:middle;font-family:${EMAIL_SANS};font-size:14px;color:#bdcaba;">${escapeHtml(orderNumberHeader)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${ctaHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px 8px;">
            <p style="margin:0 0 12px;font-family:${EMAIL_SANS};font-size:18px;font-weight:bold;color:#000000;line-height:1.35;">${escapeHtml(greeting)}</p>
            ${bodyHtml}
            <div style="margin:0 0 10px;">${typePng('order-summary.png', 139, 22, 'Order Summary')}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e5e2e1;">
              <tr>
                <td style="padding:24px 24px 4px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${summaryRow('order-label-address.png', 61, 14, 'Address:', address)}
                    ${summaryRow('order-label-payment.png', 122, 18, 'Payment Method:', paymentMethod)}
                    ${summaryRow('order-label-total.png', 84, 14, 'Order Total:', orderTotal)}
                    ${summaryRow('order-label-number.png', 59, 14, 'Order #:', orderNumberSummary)}
                    ${summaryRow('order-label-date.png', 81, 14, 'Order Date:', orderDate)}
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
              <tr>
                <td style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;">${typePng('order-col-item.png', 35, 14, 'Item')}</td>
                <td align="center" width="48" style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;">${typePng('order-col-qty.png', 27, 17, 'Qty')}</td>
                <td align="right" width="72" style="padding:0 0 8px;border-bottom:1px solid #e5e2e1;vertical-align:bottom;">${typePng('order-col-price.png', 36, 14, 'Price')}</td>
              </tr>
              ${lineItemRowsHtml(items)}
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="vertical-align:middle;">${typePng('order-row-total.png', 38, 14, 'Total')}</td>
                <td align="right" style="font-family:${EMAIL_SANS};font-size:18px;font-weight:bold;color:#ba1a1a;">${escapeHtml(itemsTotal)}</td>
              </tr>
            </table>
            <table role="presentation" class="oe-support-desktop" cellpadding="0" cellspacing="0" align="center" style="margin:40px auto 0;">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${SUPPORT_URL}" width="402" height="36" alt="${escapeHtml(SUPPORT_ALT)}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                  </a>
                </td>
              </tr>
            </table>
            <table role="presentation" class="oe-support-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;margin:40px auto 0;">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${SUPPORT_MOBILE_URL}" width="310" height="52" alt="${escapeHtml(SUPPORT_ALT)}" style="display:block;border:0;margin:0 auto;width:310px;height:auto;max-width:100%;">
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#bdcaba;padding:28px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${CONTACT_URL}" width="76" height="23" alt="Contact Us" style="display:inline-block;border:0;width:76px;height:23px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Privacy%20Policy" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${PRIVACY_URL}" width="92" height="23" alt="Privacy Policy" style="display:inline-block;border:0;width:92px;height:23px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${UNSUBSCRIBE_URL}" width="85" height="23" alt="Unsubscribe" style="display:inline-block;border:0;width:85px;height:23px;">
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:25px;">
                  <img src="${NONPROFIT_URL}" width="376" height="23" alt="Clean Up - Give Back is a 501(c)(3) nonprofit organization" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
