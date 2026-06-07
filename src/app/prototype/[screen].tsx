import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Allow <iframe> in JSX for the web platform code path
declare global {
  namespace JSX {
    interface IntrinsicElements {
      iframe: React.DetailedHTMLProps<
        React.IframeHTMLAttributes<HTMLIFrameElement>,
        HTMLIFrameElement
      >;
    }
  }
}


const HTML_MAP: Record<string, any> = {
  'cleanup_giveback_redone_prd_full_layouts_md': require('../../../assets/stitch/cleanup_giveback_redone_prd_full_layouts_md.html'),
  'product_detail__cleanup_kit___high_fidelity': require('../../../assets/stitch/product_detail__cleanup_kit___high_fidelity.html'),
  'notification_settings___refined_toggles': require('../../../assets/stitch/notification_settings___refined_toggles.html'),
  'submission_confirmation___prd_aligned': require('../../../assets/stitch/submission_confirmation___prd_aligned.html'),
  'welcome___standardized_progress': require('../../../assets/stitch/welcome___standardized_progress.html'),
  'submission_confirmation___refined_design': require('../../../assets/stitch/submission_confirmation___refined_design.html'),
  'restart_required': require('../../../assets/stitch/restart_required.html'),
  'home_dashboard___final_branding': require('../../../assets/stitch/home_dashboard___final_branding.html'),
  'shop_home___prd___reference_aligned': require('../../../assets/stitch/shop_home___prd___reference_aligned.html'),
  'live_session___refined_map_tracker': require('../../../assets/stitch/live_session___refined_map_tracker.html'),
  'sessions_list_view___standardized_refined': require('../../../assets/stitch/sessions_list_view___standardized_refined.html'),
  'account': require('../../../assets/stitch/account.html'),
  'order_history': require('../../../assets/stitch/order_history.html'),
  'notification_preference___standardized_redo': require('../../../assets/stitch/notification_preference___standardized_redo.html'),
  'photo_checkpoint': require('../../../assets/stitch/photo_checkpoint.html'),
  'sessions_calendar_view___standardized_refined': require('../../../assets/stitch/sessions_calendar_view___standardized_refined.html'),
  'donation_history': require('../../../assets/stitch/donation_history.html'),
  'session_setup___prd_aligned_standardized': require('../../../assets/stitch/session_setup___prd_aligned_standardized.html'),
  'sessions_calendar_view___with_toggle': require('../../../assets/stitch/sessions_calendar_view___with_toggle.html'),
  'shopping_cart__no_tote_bag_': require('../../../assets/stitch/shopping_cart__no_tote_bag_.html'),
  'welcome': require('../../../assets/stitch/welcome.html'),
  'create_account___standardized_progress': require('../../../assets/stitch/create_account___standardized_progress.html'),
  'thank_you___no_tote_bag_': require('../../../assets/stitch/thank_you___no_tote_bag_.html'),
  'export_service_record': require('../../../assets/stitch/export_service_record.html'),
  'account_details___standardized_progress': require('../../../assets/stitch/account_details___standardized_progress.html'),
  'donate': require('../../../assets/stitch/donate.html'),
  'setup_complete': require('../../../assets/stitch/setup_complete.html'),
  'coachmark_tutorial': require('../../../assets/stitch/coachmark_tutorial.html'),
  'approval_history': require('../../../assets/stitch/approval_history.html'),
  'checkout_form': require('../../../assets/stitch/checkout_form.html'),
  'events_detail': require('../../../assets/stitch/events_detail.html'),
};

// Navigation table: [textToMatch, cssSelector, targetScreenKey]
const NAV_RULES: [string, string, string][] = [
  ['Sign up with Email',  'button,a',  'create_account___standardized_progress'],
  ['Continue with Apple', 'button,a',  'home_dashboard___final_branding'],
  ['Continue with Google','button,a',  'home_dashboard___final_branding'],
  ['Log in',             'a,button',  'home_dashboard___final_branding'],
  ['Enable Notifications','button',    'setup_complete'],
  ['Not now',            'button',    'setup_complete'],
  ['Start Quick Tour',   'button',    'coachmark_tutorial'],
  ['Start Tracking',     'button',    'session_setup___prd_aligned_standardized'],
  ['Go to Home',         'button',    'home_dashboard___final_branding'],
  ['Start Session',      'button,a',  'live_session___refined_map_tracker'],
  ['Submit a photo',     'button',    'photo_checkpoint'],
  ['End Session',        'button',    'submission_confirmation___prd_aligned'],
  ['Submit Photo',       'button',    'photo_checkpoint'],
  ['+ Add',              'button',    'shopping_cart__no_tote_bag_'],
  ['Submit for Approval','button',    'home_dashboard___final_branding'],
  ['Add to Cart',        'button',    'shopping_cart__no_tote_bag_'],
  ['Place Order',        'button,a',  'thank_you___no_tote_bag_'],
  ['Donate Now',         'button',    'thank_you___no_tote_bag_'],
  ['Donate',             'button',    'thank_you___no_tote_bag_'],
  ['Return to Home',     'button,a',  'home_dashboard___final_branding'],
  ['View All',           'a',         'events_detail'],
  ['Register for this Event', 'button', 'home_dashboard___final_branding'],
  ['Export Service Record','button',  'export_service_record'],
  ['Approval History',   'button',    'approval_history'],
  ['Order History',      'button',    'order_history'],
  ['Donation History',   'button',    'donation_history'],
  ['Notifications',      'button',    'notification_settings___refined_toggles'],
  ['Calendar',           'button,a',  'sessions_calendar_view___with_toggle'],
  ['List',               'button,a',  'sessions_list_view___standardized_refined'],
];

const SCREEN_RULES: Record<string, [string, string, string][]> = {
  'welcome': [
    ['Sign up with Email', 'button', 'create_account___standardized_progress'],
    ['Log in', 'a', 'home_dashboard___final_branding'],
  ],
  'create_account___standardized_progress': [
    ['Continue', 'button', 'account_details___standardized_progress'],
    ['Previous', 'button', 'welcome___standardized_progress'],
  ],
  'account_details___standardized_progress': [
    ['Continue', 'button', 'notification_preference___standardized_redo'],
    ['Previous', 'button', 'create_account___standardized_progress'],
  ],
  'notification_preference___standardized_redo': [
    ['Enable Notifications', 'button', 'setup_complete'],
    ['Not now', 'button', 'setup_complete'],
    ['Previous', 'button', 'account_details___standardized_progress'],
  ],
  'setup_complete': [
    ['Start Quick Tour', 'button', 'coachmark_tutorial'],
    ['Start Tracking', 'button', 'session_setup___prd_aligned_standardized'],
    ['Go to Home', 'button', 'home_dashboard___final_branding'],
  ],
  'session_setup___prd_aligned_standardized': [
    ['Continue', 'button', 'live_session___refined_map_tracker'],
    ['Start', 'button', 'live_session___refined_map_tracker'],
  ],
  'shopping_cart__no_tote_bag_': [
    ['Checkout', 'button,a', 'checkout_form'],
  ],
  'checkout_form': [
    ['Place Order', 'button', 'thank_you___no_tote_bag_'],
  ],
  'submission_confirmation___prd_aligned': [
    ['Submit for Approval', 'button', 'home_dashboard___final_branding'],
    ['Continue', 'button', 'home_dashboard___final_branding'],
  ],
  'donate': [['Donate', 'button', 'thank_you___no_tote_bag_']],
  'thank_you___no_tote_bag_': [
    ['Continue Shopping', 'button,a', 'shop_home___prd___reference_aligned'],
    ['Return to Home', 'button,a', 'home_dashboard___final_branding'],
  ],
};

// Bottom-nav icon name → screen
const ICON_NAV: Record<string, string> = {
  'home': 'home_dashboard___final_branding',
  'shopping_bag': 'shop_home___prd___reference_aligned',
  'shopping_cart': 'shopping_cart__no_tote_bag_',
  'add': 'session_setup___prd_aligned_standardized',
  'history': 'sessions_list_view___standardized_refined',
  'person': 'account',
  'add_circle': 'session_setup___prd_aligned_standardized',
  'map': 'sessions_list_view___standardized_refined',
  'event_note': 'sessions_list_view___standardized_refined',
  'arrow_back': '__back__',
  'close': '__back__',
};

function buildNavScript(screenKey: string, isWeb: boolean = false): string {
  const rules = [...NAV_RULES, ...(SCREEN_RULES[screenKey] ?? [])];
  
  const postLogic = isWeb 
    ? `window.parent.postMessage(JSON.stringify({type:'nav',screen:screen}), '*');`
    : `if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:'nav',screen:screen}));`;

  return `
(function(){
  var RULES = ${JSON.stringify(rules)};
  var ICONS = ${JSON.stringify(ICON_NAV)};
  var CURRENT = ${JSON.stringify(screenKey)};

  var posting = false;
  function post(screen){ 
    if(posting) return;
    posting = true;
    ${postLogic}
    setTimeout(function(){ posting = false; }, 500);
  }

  function wire(){
    // Wire text-based rules
    RULES.forEach(function(r){
      var match=r[0].toLowerCase(), sel=r[1], target=r[2];
      sel.split(',').forEach(function(s){
        document.querySelectorAll(s.trim()).forEach(function(el){
          var t=(el.textContent||'').toLowerCase().replace(/\\s+/g,' ').trim();
          if(t.indexOf(match)!==-1){
            if(!el.dataset.navWired) {
              el.dataset.navWired = 'true';
              el.addEventListener('click', function(e){ e.preventDefault(); e.stopImmediatePropagation(); post(target); }, true);
            }
          }
        });
      });
    });

    // Wire icon-based nav (bottom nav + back buttons)
    document.querySelectorAll('.material-symbols-outlined').forEach(function(icon){
      var name=(icon.textContent||'').trim();
      if(!ICONS[name]) return;
      var target=ICONS[name];
      var btn=icon.closest('button')||icon.closest('a')||icon.parentElement;
      if(!btn || btn.dataset.navWired) return;
      btn.dataset.navWired = 'true';
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopImmediatePropagation();
        post(target);
      }, true);
    });

    // Shop Filters
    if (CURRENT === 'shop_home___prd___reference_aligned') {
      var catMap = {
        'Trash Grabber': 'Tools',
        'Adult Vest': 'Safety',
        'Child Vest': 'Safety',
        'Nitrile Gloves': 'Safety'
      };
      var filterButtons = Array.from(document.querySelectorAll('button')).filter(function(b) {
        return ['All', 'Kits', 'Tools', 'Safety', 'Bags'].indexOf((b.textContent||'').trim()) !== -1;
      });
      var products = Array.from(document.querySelectorAll('h4')).map(function(h4) { return h4.closest('.flex-col'); }).filter(Boolean);

      filterButtons.forEach(function(btn) {
        btn.dataset.navWired = 'true';
        btn.addEventListener('click', function(e) {
          e.preventDefault(); e.stopImmediatePropagation();
          var filter = (btn.textContent||'').trim();
          
          filterButtons.forEach(function(b) {
            b.classList.remove('bg-[#e8ebe9]');
            b.classList.add('border', 'border-outline-variant');
          });
          btn.classList.add('bg-[#e8ebe9]');
          btn.classList.remove('border', 'border-outline-variant');

          products.forEach(function(p) {
            var h4 = p.querySelector('h4');
            if (!h4) return;
            var title = (h4.textContent||'').trim();
            var category = catMap[title] || 'Tools';
            if (filter === 'All' || category === filter) {
              p.style.display = 'flex';
            } else {
              p.style.display = 'none';
            }
          });
        }, true);
      });
    }

    // Wire all <a href="*.html"> links
    document.querySelectorAll('a[href]').forEach(function(a){
      if(a.dataset.navWired) return;
      var href=a.getAttribute('href')||'';
      var m=href.match(/([^/]+)\\.html/);
      if(m&&m[1]){
        a.dataset.navWired = 'true';
        a.addEventListener('click', function(e){ e.preventDefault(); e.stopImmediatePropagation(); post(m[1]); }, true);
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
true;
`;
}

async function loadHtml(assetModule: any): Promise<string> {
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  // Prefer local file (works in prod + dev after download)
  if (asset.localUri) {
    try {
      return await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'utf8' as any });
    } catch (_) {}
  }

  // Fallback: fetch from Metro dev server
  const res = await fetch(asset.uri);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${asset.uri}`);
  return res.text();
}

function getIframeHtml(html: string, screenKey: string) {
  const script = buildNavScript(screenKey, true);
  return html.replace('</head>', `<script>${script}</script></head>`);
}

export default function PrototypeScreen() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initialScreen = Array.isArray(screen) ? screen[0] : (screen || 'welcome');
  const [historyStack, setHistoryStack] = useState<string[]>([initialScreen]);
  const currentScreen = historyStack[historyStack.length - 1];
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const assetModule = HTML_MAP[currentScreen];

  useEffect(() => {
    setHtml(null);
    setError(null);
    if (!assetModule) { setError(`Unknown screen: ${currentScreen}`); return; }
    loadHtml(assetModule)
      .then(setHtml)
      .catch(err => setError(String(err)));
  }, [currentScreen]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'nav' && data.screen) {
            if (data.screen === '__back__') {
              setHistoryStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
            } else if (data.screen !== currentScreen) {
              setHistoryStack(prev => [...prev, data.screen]);
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', `/prototype/${data.screen}`);
              }
            }
          }
        } catch {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [currentScreen]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'nav' && data.screen) {
        if (data.screen === '__back__') {
          setHistoryStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
        } else if (data.screen !== currentScreen) {
          setHistoryStack(prev => [...prev, data.screen]);
          router.setParams({ screen: data.screen });
        }
      }
    } catch {}
  };

  if (error) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: '#ba1a1a', fontSize: 13, padding: 24, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {html ? (
        Platform.OS === 'web' ? (
          <iframe
            title={currentScreen.replace(/_/g, ' ')}
            srcDoc={getIframeHtml(html, currentScreen)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <WebView
            source={{ html, baseUrl: `https://app.local/${currentScreen}.html` }}
            injectedJavaScript={buildNavScript(currentScreen)}
            onMessage={onMessage}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
          />
        )
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color="#006b2c" size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  loading:   { flex: 1, backgroundColor: '#fcf9f8', alignItems: 'center', justifyContent: 'center' },
});
