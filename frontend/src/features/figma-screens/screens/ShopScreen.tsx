import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { addCartItem } from '../cartStore';
import { CartBadge } from '../components/CartBadge';
import { EmptyCartToast, useCartIconPress } from '../components/EmptyCartToast';
import {
  ShopCartIcon,
  ShopDonateIcon,
  ShopDonateWave,
  ShopStreakIcon,
} from '../components/ShopIcons';
import { CART_ASSETS } from '../mocks/cart';
import { getProductDetail, SHOP_PRODUCT_TO_DETAIL_ID } from '../mocks/productDetail';
import { SHOP_HOME_ASSETS } from '../shopAssets';
import { layout, colors, fontFamilies, radius as R, shadows } from '../tokens';

// ─── Types ────────────────────────────────────────────────────────────────────
type DonationAmount = '$5' | '$10' | '$15' | 'Custom';
type CategoryTab = 'All' | 'Kits' | 'Tools' | 'Safety' | 'Bags';

function donateHref(amount: DonationAmount): Href {
  if (amount === 'Custom') return '/donate?amount=custom' as Href;
  return `/donate?amount=${amount.replace('$', '')}` as Href;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: number;
  inStock: boolean;
  category: Exclude<CategoryTab, 'All'>;
}

const DONATION_AMOUNTS: DonationAmount[] = ['$5', '$10', '$15'];

const CATEGORY_TABS: CategoryTab[] = ['All', 'Kits', 'Tools', 'Safety', 'Bags'];

const PRODUCTS: Product[] = [
  {
    id: 'kit',
    name: 'Trash Clean Up Kit',
    price: '$29.99',
    image: SHOP_HOME_ASSETS.featuredKit,
    inStock: true,
    category: 'Kits',
  },
  { id: '1', name: 'Reusable Tote Bags', price: '$3.00', image: SHOP_HOME_ASSETS.productToteBags, inStock: true, category: 'Bags' },
  { id: '2', name: 'Trash Grabber', price: '$23.99', image: SHOP_HOME_ASSETS.productTrashGrabber, inStock: true, category: 'Tools' },
  { id: '3', name: 'Child Safety Vest', price: '$9.99', image: SHOP_HOME_ASSETS.productChildVest, inStock: true, category: 'Safety' },
  { id: '4', name: 'Adult Safety Vest', price: '$12.99', image: SHOP_HOME_ASSETS.productAdultVest, inStock: true, category: 'Safety' },
];


// ─── Top App Bar (Figma 498:661) ──────────────────────────────────────────────
function parsePrice(price: string): number {
  return Number.parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

function TopAppBar({
  cartCount,
  onCartPress,
}: {
  cartCount: number;
  onCartPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        s.topBar,
        shadows.barTop,
        { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom },
      ]}
    >
      <View style={s.topBarRow}>
        <View style={s.topBarSide} />

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle}>Shop</Text>
        </View>

        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarCartBtn}
          onPress={onCartPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        >
          <View style={s.cartIconWrap}>
            <ShopCartIcon width={24} height={24} />
            <CartBadge count={cartCount} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

// ─── Donate Section ───────────────────────────────────────────────────────────
function DonateSection({ onDonate }: { onDonate: (amount: DonationAmount) => void }) {
  return (
    <View style={s.donateCard}>
      <View style={s.donateWaveWrap} pointerEvents="none">
        <ShopDonateWave style={s.donateWave} />
      </View>

      <View style={s.donateContent}>
        <View style={s.donateIconCircle}>
          <ShopDonateIcon width={38} height={38} />
        </View>

        <View style={s.donateDetails}>
          <View style={s.donateCopy}>
            <Text style={s.donateTitle}>Donate to Clean-Up Give Back</Text>
            <Text style={s.donateSubtitle}>
              Help fund cleanup efforts directly. Your{'\n'}
              contribution provides essential supplies to{'\n'}
              volunteers nationwide.
            </Text>
          </View>

          <View style={s.donateAmountsBlock}>
            <View style={s.donateAmountsRow}>
              {DONATION_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={s.donateAmountBtn}
                  onPress={() => onDonate(amount)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Donate ${amount}`}
                >
                  <Text style={s.donateAmountText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.donateCustomBtn}
              onPress={() => onDonate('Custom')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Enter custom donation amount"
            >
              <Text style={s.donateCustomText}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Featured Item ────────────────────────────────────────────────────────────
function FeaturedItem({
  onViewKit,
  onAddToCart,
}: {
  onViewKit: () => void;
  onAddToCart: () => void;
}) {
  return (
    <View style={s.featuredSection}>
      <Text style={s.sectionLabel}>FEATURED ITEM</Text>
      <AnimatedPressable
        scaleTo={0.98}
        style={s.featuredCard}
        onPress={onViewKit}
        accessibilityRole="button"
        accessibilityLabel="View Trash Clean Up Kit"
      >
        <View style={s.featuredImageWrap}>
          <ExpoImage source={SHOP_HOME_ASSETS.featuredKit} style={s.featuredImage} contentFit="contain" cachePolicy="memory-disk" priority="high" transition={0} />
        </View>

        <View style={s.featuredDetails}>
          <View style={s.featuredTitleRow}>
            <View style={s.featuredNameCol}>
              <View style={s.bestSellerBadge}>
                <Text style={s.bestSellerText}>Best Seller</Text>
                <ShopStreakIcon width={14} height={14} />
              </View>
              <Text style={s.featuredName}>Trash Clean Up Kit</Text>
              <Text style={s.featuredStock}>In stock</Text>
            </View>
            <Text style={s.featuredPrice}>$29.99</Text>
          </View>

          <View style={s.featuredBtnGroup}>
            <AnimatedPressable
              scaleTo={0.97}
              style={s.viewKitBtn}
              onPress={onViewKit}
              accessibilityRole="button"
              accessibilityLabel="View Trash Clean Up Kit"
            >
              <Text style={s.viewKitText}>View Kit</Text>
            </AnimatedPressable>

            <AnimatedPressable
              scaleTo={0.97}
              style={s.addToCartBtn}
              onPress={onAddToCart}
              accessibilityRole="button"
              accessibilityLabel="Add Trash Clean Up Kit to cart"
            >
              <Text style={s.addToCartText}>Add to cart</Text>
            </AnimatedPressable>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

// ─── Category Tabs ────────────────────────────────────────────────────────────
function CategoryTabs({
  activeCategory,
  onSelect,
}: {
  activeCategory: CategoryTab;
  onSelect: (cat: CategoryTab) => void;
}) {
  return (
    <View style={s.tabsRow}>
      {CATEGORY_TABS.map((cat) => {
        const active = cat === activeCategory;
        return (
          <TouchableOpacity
            key={cat}
            style={[s.tabChip, active ? s.tabChipActive : s.tabChipInactive]}
            onPress={() => onSelect(cat)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${cat}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={s.tabChipText} numberOfLines={1}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  onView,
  onAddToCart,
}: {
  product: Product;
  onView: () => void;
  onAddToCart: () => void;
}) {
  return (
    <AnimatedPressable
      scaleTo={0.97}
      style={s.productCard}
      onPress={onView}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
    >
      <View style={s.productImageWrap}>
        <ExpoImage source={product.image} style={s.productImage} contentFit="contain" cachePolicy="memory-disk" priority="high" transition={0} />
      </View>
      <View style={s.productBody}>
        <View style={s.productInfo}>
          <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
          <Text style={s.productPrice}>{product.price}</Text>
          <Text style={s.productStock}>{product.inStock ? 'In stock' : 'Out of stock'}</Text>
        </View>
        <View style={s.productActions}>
          <AnimatedPressable
            scaleTo={0.97}
            style={s.productViewBtn}
            onPress={onView}
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name}`}
          >
            <Text style={s.productViewText}>View</Text>
          </AnimatedPressable>
          <AnimatedPressable
            scaleTo={0.97}
            style={s.productAddBtn}
            onPress={onAddToCart}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            <Text style={s.productAddText}>Add to cart</Text>
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// ─── Product Grid ─────────────────────────────────────────────────────────────
function ProductGrid({
  products,
  onViewProduct,
  onAddProduct,
}: {
  products: Product[];
  onViewProduct: (productId: string) => void;
  onAddProduct: (product: Product) => void;
}) {
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  if (products.length === 0) {
    return (
      <View style={s.emptyFilter}>
        <Text style={s.emptyFilterText}>No products in this category yet.</Text>
      </View>
    );
  }

  return (
    <View style={s.productGrid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={s.productRow}>
          {row.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={() => onViewProduct(product.id)}
              onAddToCart={() => onAddProduct(product)}
            />
          ))}
          {row.length === 1 && <View style={s.productCardPlaceholder} />}
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartCount, onCartPress, toastVisible, toastKey } = useCartIconPress();
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('All');
  const bottomInset = Math.max(insets.bottom, 0);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const addShopProduct = (product: Product) => {
    const detailId = SHOP_PRODUCT_TO_DETAIL_ID[product.id] ?? product.id;
    const detail = getProductDetail(detailId);
    addCartItem({
      id: detailId,
      name: product.name,
      unitPrice: parsePrice(product.price),
      image: product.image,
      description: detail.description,
    });
    router.push('/cart' as Href);
  };

  return (
    <View style={s.root}>
      <TopAppBar cartCount={cartCount} onCartPress={onCartPress} />
      <EmptyCartToast key={toastKey} visible={toastVisible} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: bottomInset + layout.bottomNavHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.missionBlock}>
          <View style={s.catalogBlock}>
            <View style={s.primaryStack}>
              <DonateSection onDonate={(amount) => router.push(donateHref(amount))} />
              <FeaturedItem
                onViewKit={() => router.push('/product-detail?id=cleanup-kit' as Href)}
                onAddToCart={() => {
                  const kit = getProductDetail('cleanup-kit');
                  addCartItem({
                    id: kit.id,
                    name: kit.name,
                    unitPrice: parsePrice(kit.price),
                    image: CART_ASSETS.kitThumb,
                    description: kit.description,
                  });
                  router.push('/cart' as Href);
                }}
              />
            </View>

            <View style={s.listingsBlock}>
              <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} />
              <ProductGrid
                products={filteredProducts}
                onViewProduct={(productId) => {
                  const detailId = SHOP_PRODUCT_TO_DETAIL_ID[productId];
                  if (detailId) {
                    router.push(`/product-detail?id=${detailId}` as Href);
                  }
                }}
                onAddProduct={addShopProduct}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="shop"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={() => router.push('/session-setup-guide')}
          onSessionsPress={() => router.push('/sessions-list')}
          onProfilePress={() => router.push('/account')}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },

  // Top app bar — Figma 498:661
  topBar: {
    backgroundColor: colors.white,
    zIndex: 10,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarSide: {
    width: 44,
    height: 44,
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  topBarCartBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconWrap: {
    width: 24,
    height: 24,
    overflow: 'visible',
  },

  // Scroll — Figma Mission Statement 657:1275 (left 15, gap 20)
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  missionBlock: {
    gap: 20,
  },
  missionText: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textNavInactive,
  },
  catalogBlock: {
    gap: 20,
  },
  primaryStack: {
    gap: 30,
  },
  listingsBlock: {
    gap: 20,
  },

  // Donate card — Figma 627:437
  donateCard: {
    backgroundColor: colors.primary,
    borderRadius: R.sm,
    overflow: 'hidden',
    minHeight: 412,
  },
  donateWaveWrap: {
    position: 'absolute',
    // Figma 627:438 inset ≈ top -3.4%, right -37.8%, bottom 24.9%, left 41.7%
    top: -14,
    right: -136,
    bottom: 100,
    left: '42%',
    zIndex: 0,
    opacity: 1,
  },
  donateWave: {
    width: '100%',
    height: '100%',
  },
  donateContent: {
    zIndex: 1,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 30,
  },
  donateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: R.full,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateDetails: {
    width: '100%',
    gap: 24,
  },
  donateCopy: {
    gap: 8,
    alignItems: 'center',
  },
  donateTitle: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 26,
  },
  donateSubtitle: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },
  donateAmountsBlock: {
    width: '100%',
    gap: 12,
    zIndex: 1,
  },
  donateAmountsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  donateAmountBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: R.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  donateAmountText: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 17,
    color: colors.textPrimary,
    lineHeight: 25,
  },
  donateCustomBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: R.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  donateCustomText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 17,
    color: colors.white,
    lineHeight: 25,
  },

  // Featured section — Figma 510:1129
  featuredSection: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    lineHeight: 24,
  },
  featuredCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    overflow: 'hidden',
  },
  featuredImageWrap: {
    height: 246,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImage: {
    width: 237,
    height: 227,
  },
  featuredDetails: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 20,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  featuredNameCol: {
    flex: 1,
    gap: 5,
  },
  bestSellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentLime,
    borderRadius: 23,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    minHeight: 20,
    overflow: 'visible',
  },
  bestSellerText: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
    lineHeight: 12,
  },
  featuredName: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  featuredStock: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  featuredPrice: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 24,
    color: colors.primary,
  },
  featuredBtnGroup: {
    gap: 8,
  },
  viewKitBtn: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewKitText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addToCartBtn: {
    backgroundColor: colors.primary,
    borderRadius: R.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },

  // Category tabs — Figma 498:836 (full-width row; no horizontal scroll)
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabChip: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: R.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: colors.chipBg,
  },
  tabChipInactive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  tabChipText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Product grid — Figma 515:1543 (gap 20)
  productGrid: {
    gap: 20,
  },
  productRow: {
    flexDirection: 'row',
    gap: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.sm,
    overflow: 'hidden',
  },
  productCardPlaceholder: {
    flex: 1,
  },
  productImageWrap: {
    height: 163,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderOutline,
  },
  productImage: {
    width: '92%',
    height: '85%',
  },
  productBody: {
    padding: 16,
    gap: 15,
  },
  productInfo: {
    gap: 5,
  },
  productName: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  productPrice: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 18,
    color: colors.primary,
    lineHeight: 18,
  },
  productStock: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    lineHeight: 18,
  },
  productActions: {
    gap: 10,
  },
  productViewBtn: {
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.sm,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  productViewText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  productAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: R.sm,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productAddText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  emptyFilter: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },

  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    ...shadows.navBottom,
  },
});
