/**
 * Product detail mocks — Figma shop_product_view frames (PRD §6.21).
 * Kit: `492:114`; grabber `909:126`; tote `905:166`; adult vest `905:236`; child vest `905:306`.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const assets = {
  kitHero: require('@/assets/figma/shop/product-detail/kit-hero.png') as number,
  gloves: require('@/assets/figma/shop/product-detail/gloves.png') as number,
  trashGrabberThumb: require('@/assets/figma/shop/product-detail/trash-grabber.png') as number,
  trashGrabber: require('@/assets/figma/shop/product-detail/trash-grabber-detail.png') as number,
  adultVest: require('@/assets/figma/shop/product-detail/adult-vest-detail.png') as number,
  adultVestShop: require('@/assets/figma/shop/product-adult-vest.png') as number,
  childVest: require('@/assets/figma/shop/product-child-vest.png') as number,
  toteBags: require('@/assets/figma/shop/product-detail/tote-bags.png') as number,
};

export type ProductId =
  | 'cleanup-kit'
  | 'trash-grabber'
  | 'tote-bags'
  | 'adult-safety-vest'
  | 'child-safety-vest';

export type ToteColor = 'earth' | 'ocean';

export interface ProductInclude {
  label: string;
  image: number;
}

export interface ProductColorSwatch {
  id: ToteColor;
  label: string;
  hex: string;
}

export interface ProductDetail {
  id: ProductId;
  name: string;
  price: string;
  inStock: boolean;
  description: string;
  /** Best Seller badge — kit only */
  bestSeller?: boolean;
  images: number[];
  /** Thumbnail strip for kit carousel */
  thumbnails?: number[];
  includes?: ProductInclude[];
  colors?: ProductColorSwatch[];
  figmaNode: string;
}

export const PRODUCT_DETAIL_ASSETS = assets;

export const PRODUCT_DETAILS: Record<ProductId, ProductDetail> = {
  'cleanup-kit': {
    id: 'cleanup-kit',
    name: 'Trash Clean Up Kit',
    price: '$29.99',
    inStock: true,
    bestSeller: true,
    figmaNode: '492:114',
    description:
      'Our comprehensive starter kit includes a professional-grade trash grabber, high-visibility adult safety vest, and 10 pairs of premium nitrile gloves. Everything you need to start your first cleanup session with confidence.',
    images: [assets.kitHero, assets.adultVestShop, assets.gloves, assets.trashGrabberThumb],
    thumbnails: [assets.kitHero, assets.adultVestShop, assets.gloves, assets.trashGrabberThumb],
    includes: [
      { label: '36" Ergonomic Grabber', image: assets.trashGrabberThumb },
      { label: 'One-size High-Vis Vest', image: assets.adultVestShop },
      { label: '10x Heavy-Duty Gloves', image: assets.gloves },
    ],
  },
  'trash-grabber': {
    id: 'trash-grabber',
    name: 'Trash Grabber',
    price: '$23.99',
    inStock: true,
    figmaNode: '909:126',
    description:
      'Elevate your cleanup experience with our high-quality Trash Grabber! Designed for efficiency and durability, this essential tool helps you pick up litter effortlessly, contributing to a cleaner community!',
    images: [assets.trashGrabber],
  },
  'tote-bags': {
    id: 'tote-bags',
    name: 'Reusable Earth and Ocean Tote Bags',
    price: '$3.00',
    inStock: true,
    figmaNode: '905:166',
    description:
      'Embrace style and sustainability with our Reusable Earth and Ocean Tote Bags! Made from recycled materials, this cute, environmentally conscious accessory is perfect for your shopping needs! Carry your essentials while making a statement for a cleaner planet!',
    images: [assets.toteBags],
    colors: [
      { id: 'earth', label: 'Earth', hex: '#009540' },
      { id: 'ocean', label: 'Ocean', hex: '#2F80ED' },
    ],
  },
  'adult-safety-vest': {
    id: 'adult-safety-vest',
    name: 'Adult Safety Vest',
    price: '$12.99',
    inStock: true,
    figmaNode: '905:236',
    description:
      "Prioritize safety during your cleanups with our Adult Safety Vest. Stay visible and protected, allowing you to focus on making a difference in your community. If you want to see it in action, just look around our website, you'll find it! Your purchase aids a safer environment.",
    images: [assets.adultVest],
  },
  'child-safety-vest': {
    id: 'child-safety-vest',
    name: 'Child Safety Vest',
    price: '$9.99',
    inStock: true,
    figmaNode: '905:306',
    description:
      'Inspire the next generation of environmental stewards with our Child Safety Vest! Designed for comfort and visibility, this vest ensures young volunteers can actively participate in cleanups. Your purchase contributes to a greener future for the next generation!',
    images: [assets.childVest],
  },
};

const DEFAULT_PRODUCT_ID: ProductId = 'cleanup-kit';

export function isProductId(value: string | undefined): value is ProductId {
  return value != null && value in PRODUCT_DETAILS;
}

export function getProductDetail(id: string | undefined): ProductDetail {
  if (isProductId(id)) {
    return PRODUCT_DETAILS[id];
  }
  return PRODUCT_DETAILS[DEFAULT_PRODUCT_ID];
}

/** Map shop grid product ids → product-detail route ids */
export const SHOP_PRODUCT_TO_DETAIL_ID: Record<string, ProductId> = {
  kit: 'cleanup-kit',
  '1': 'tote-bags',
  '2': 'trash-grabber',
  '3': 'child-safety-vest',
  '4': 'adult-safety-vest',
};
