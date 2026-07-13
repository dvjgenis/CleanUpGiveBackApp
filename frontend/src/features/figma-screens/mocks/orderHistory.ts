export type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  dateLabel: string;
  productName: string;
  priceLabel: string;
  statusLabel: string;
  muted?: boolean;
};

/** Mock orders for Order History (Figma `order_history`, node `854:116`). */
export const defaultOrderHistory: OrderHistoryItem[] = [
  {
    id: 'ord-49201',
    orderNumber: 'ORDER #49201',
    dateLabel: 'October 12, 2023',
    productName: 'Trash Clean-up Kit',
    priceLabel: '$29.99',
    statusLabel: 'Delivered',
  },
  {
    id: 'ord-48892',
    orderNumber: 'ORDER #48892',
    dateLabel: 'September 28, 2023',
    productName: 'Heavy Duty Gloves (Pair)',
    priceLabel: '$23.99',
    statusLabel: 'Delivered',
  },
  {
    id: 'ord-47105',
    orderNumber: 'ORDER #47105',
    dateLabel: 'July 05, 2023',
    productName: 'Tote Bags',
    priceLabel: '$3.00',
    statusLabel: 'Delivered',
    muted: true,
  },
];
