export type PrivacySection = {
  title: string;
  body: string;
};

/** Effective date for the in-app privacy policy (draft product copy). */
export const PRIVACY_POLICY_EFFECTIVE_DATE = 'July 20, 2026';

/** Last-updated date and time shown on the privacy policy index and detail screens. */
export const PRIVACY_POLICY_LAST_UPDATED = 'July 23, 2026 at 5:17 PM CDT';

export type PrivacyPolicyIndexRow = {
  title: string;
  description: string;
  href:
    | '/privacy-what-we-collect'
    | '/privacy-how-we-use-it'
    | '/privacy-who-we-share-it-with'
    | '/privacy-how-we-protect-it';
};

/** Index rows on `/privacy-policy` (Figma privacy_policy / PRD §6.31). */
export const PRIVACY_POLICY_INDEX_ROWS: PrivacyPolicyIndexRow[] = [
  {
    title: 'What we collect',
    description:
      'We collect only what we need to run your account and verify service hours — like account details, session photos, and GPS routes during active cleanups.',
    href: '/privacy-what-we-collect',
  },
  {
    title: 'How we use it',
    description:
      'We use your data to verify cleanup work, prevent fraud, process payments, and keep the app running. Location is tracked only during active sessions.',
    href: '/privacy-how-we-use-it',
  },
  {
    title: 'Who we share it with',
    description:
      'We share information only with technical processors that help run the app — and with authorized program reviewers who verify your hours.',
    href: '/privacy-who-we-share-it-with',
  },
  {
    title: 'How we protect it',
    description:
      'We use encryption, access controls, and clear retention limits. You can request a copy, correction, or deletion of your data.',
    href: '/privacy-how-we-protect-it',
  },
];

export const WHAT_WE_COLLECT_SECTIONS: PrivacySection[] = [
  {
    title: 'Who we are',
    body: 'Clean Up - Give Back is a registered 501(c)(3) nonprofit based in Des Plaines, Illinois. Our mobile app (iOS and Android) helps volunteers and court-ordered participants track, verify, and document community service hours. We collect only the data we need to run the app and verify your service hours.',
  },
  {
    title: 'Account details',
    body: 'When you create an account, we collect your legal name, email address, phone number, and password (stored hashed). We also assign an anonymous account user ID. We use this information for profile creation, sign-in, account management, and official PDF service logs.',
  },
  {
    title: 'Service profile',
    body: 'You may tell us whether your community service is court-ordered. We also collect activity type, session descriptions, and digital signatures when you complete work in the app. We use this for program matching, fraud prevention, and official service verification.',
  },
  {
    title: 'Age screening',
    body: 'During signup we ask for your birth month and birth year only — not the day of the month. We use this to check that you are 13 or older (COPPA). If you are under 13, account creation is blocked and the signup details you entered are purged from the device without creating an account or storing them on our servers. If you are 13 or older, age fields may be stored with your account. We do not sell age data or use it for advertising.',
  },
  {
    title: 'Precise location (GPS)',
    body: 'While a cleanup session is active, we collect GPS route points. GPS means your phone shares your position so we can verify service time, distance, and route, and help prevent fraud. We only collect location during an active session — not while the app is idle or after you finalize or cancel a session.',
  },
  {
    title: 'Photos',
    body: 'During sessions you take live selfies and photos of collected trash or other proof of work. We use these to confirm you were present and completed community service. Authorized program and admin reviewers may see them to verify your hours. We do not use your photos for advertising.',
  },
  {
    title: 'Payment and shipping',
    body: 'For shop orders, program fees, and voluntary donations, we may collect a mailing address. Payment card details are processed by Stripe. Full card numbers are never stored on our servers.',
  },
  {
    title: 'Device and diagnostic data',
    body: 'We may collect your app version and operating system. Optional crash logs may go to Apple, Google, and/or Expo when system diagnostics are enabled. This helps us fix bugs and keep the app stable.',
  },
  {
    title: 'Communications',
    body: 'If you opt in, we may store a push notification token so Expo can deliver session alerts and program updates. We also use your email for event registration confirmations, account notices, and verification codes (for example, email-change OTP). Transactional email is delivered by Resend.',
  },
  {
    title: 'Data on your device',
    body: 'The app may store session drafts, preferences, and cached session records on your phone. This supports offline use and recovery if a session is interrupted. This local data is not shared with third parties.',
  },
  {
    title: 'Data promise',
    body: 'We do not sell or rent your personal information to third parties.',
  },
  {
    title: 'Children and teens',
    body: 'This app is not intended for children under 13. If an age under 13 is detected at signup, we block account creation and purge what you entered. Users aged 13 and older get the same high privacy defaults (for example, non-essential features and notification categories are opt-in). We do not use dark patterns to push you to share more data than you need to.',
  },
  {
    title: 'How long we keep your data',
    body: 'We keep information only as long as needed for operations, verification, and legal requirements. GPS route paths are typically kept about 90 days after session verification. Photo evidence is typically kept about 1 year unless the law or a court order requires longer. Payment records may be kept up to 7 years for tax, accounting, and Stripe rules. Account information lasts while your account is active, plus a standard grace period after closure. Court-ordered logs are kept as required by applicable authorities and court programs.',
  },
];

export const HOW_WE_USE_IT_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We use your information to run your account, verify cleanup work, process payments, send operational notices you expect, and keep the app safe. We only use data for purposes that support these features.',
  },
  {
    title: 'Run your account',
    body: 'Your name, email, phone, and related account details let you sign in, manage your profile, and generate official PDF service logs.',
  },
  {
    title: 'Verify cleanup work',
    body: 'Photos, GPS routes, session descriptions, activity type, court-ordered status, and digital signatures help us confirm where and when you worked. Reviewers use this information to approve community service hours and help prevent fraud.',
  },
  {
    title: 'Age eligibility',
    body: 'Birth month and year are used only to estimate age for COPPA compliance and to decide whether signup may continue.',
  },
  {
    title: 'Process payments',
    body: 'Mailing address and payment details (via Stripe) let you complete shop orders, program fees, and donations. We do not store your full card number.',
  },
  {
    title: 'Keep the app stable',
    body: 'App version, operating system, and optional crash logs help us find bugs and improve stability.',
  },
  {
    title: 'Send you notices',
    body: 'If you turn notifications on, we use your push token for real-time session and program alerts. We use email for registration confirmations, verification codes, and other account notices. You can change notification settings in the app.',
  },
  {
    title: 'Offline drafts',
    body: 'Session drafts and preferences stored on your device help you recover interrupted sessions and keep the app working offline.',
  },
  {
    title: 'Location tracking (session only)',
    body: 'We do not track your location while the app is idle or after a session is finalized or canceled. GPS collection starts only when you explicitly start a cleanup session (for example, tapping “Start Cleanup”). If you grant Always location access, the app may keep mapping your route while the screen is locked — only while a cleanup session remains active. Tracking stops as soon as you complete or cancel the session. A prominent on-screen indicator shows whenever active location tracking is running. Maps are drawn on your device with MapLibre. Standard basemaps load from CARTO; Satellite and Hybrid views use Esri imagery. Those providers receive standard network metadata (such as IP address) to serve map tiles. They do not receive or store your recorded walking routes. Approximate weather for an active session may come from Open-Meteo based on starting coordinates.',
  },
  {
    title: 'What we do not do',
    body: 'We do not sell or rent your personal information. We do not use your photos or location for advertising. We do not collect more data than we need to run the app and verify your cleanup work.',
  },
];

export const WHO_WE_SHARE_IT_WITH_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We share data only with technical processors needed to run the app, with authorized program reviewers who verify hours, or when the law requires it (for example, a valid court order, safety protection, or fraud investigation). We do not sell your information to data brokers or advertisers.',
  },
  {
    title: 'Supabase',
    body: 'Supabase hosts user accounts, session metadata, and uploaded photo evidence (database, auth, and media storage). Supabase does not process your data for advertising.',
  },
  {
    title: 'Fly.io',
    body: 'Fly.io hosts our Session API in the United States. That API manages cleanup sessions, finalized GPS routes, and related metadata.',
  },
  {
    title: 'Stripe',
    body: 'Stripe processes financial transactions, billing details, and identity checks for payment processing and anti-money laundering (AML) controls. Full payment card numbers are never stored on our servers.',
  },
  {
    title: 'CARTO and Esri',
    body: 'CARTO and Esri deliver basemap imagery rendered with MapLibre. Exposure is limited to standard web requests (for example, IP address) needed to load map tiles. They do not receive your walking routes.',
  },
  {
    title: 'MapLibre',
    body: 'MapLibre is an open-source mapping library that runs on your device to draw the map interface. It is client-side software, not a cloud store for your routes.',
  },
  {
    title: 'Open-Meteo',
    body: 'Open-Meteo provides approximate weather details for active sessions based on starting coordinates. Server logs that may include IP addresses or coordinates are purged within about 90 days.',
  },
  {
    title: 'Resend',
    body: 'Resend delivers transactional emails such as event registration confirmations, email-change verification codes, and other operational notices. Resend processes the recipient address and message content needed to send that email.',
  },
  {
    title: 'Expo',
    body: 'Expo provides mobile app infrastructure and routes push notification tokens when notifications are enabled.',
  },
  {
    title: 'Apple and Google',
    body: 'Apple and Google manage system-level permissions, app delivery through their stores, and optional platform crash reporting.',
  },
  {
    title: 'Authorized program administrators',
    body: 'Trained staff and program reviewers may inspect session photos, routes, and logs solely to verify and approve community service hours.',
  },
  {
    title: 'When the law requires it',
    body: 'We may share information if legally compelled — for example, a valid court order — or to protect safety or investigate fraud.',
  },
  {
    title: 'We do not sell your data',
    body: 'We do not sell or monetize personal information. Geolocation and photo data are used only for service verification. Our processors may use your information only as needed to provide their services to Clean Up - Give Back — not to sell it or use it for their own advertising.',
  },
];

export const HOW_WE_PROTECT_IT_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We protect your data with industry-standard measures. No system is perfectly secure, but we take clear steps to reduce risk.',
  },
  {
    title: 'Encryption and access controls',
    body: 'Data is encrypted in transit (TLS 1.2/1.3) and encrypted at rest across our cloud storage providers. We use Row-Level Security (RLS) policies so users can access only their own personal records. Only approved staff can access user data when needed for support, security, verification, or legal compliance.',
  },
  {
    title: 'How long we keep data',
    body: 'GPS route paths are typically retained about 90 days after session verification. Photo evidence is typically retained about 1 year unless extended by law or court order. Payment records may be retained up to 7 years. Account information lasts for the life of an active account plus a standard grace period after closure. Court-ordered logs follow applicable legal and program requirements.',
  },
  {
    title: 'Your privacy rights',
    body: 'Regardless of where you live, we extend core privacy rights to all app users. Access and portability: request a copy of your personal data or export verified service history as a PDF. Correction: ask us to update inaccurate or incomplete profile details. Deletion: request erasure of your account and associated personal data, subject to legal or court-mandated retention. Non-discrimination: we will not degrade app performance or treat you differently for exercising these rights. Do not sell: we do not sell or monetize personal information.',
  },
  {
    title: 'How to exercise your rights',
    body: 'You can manage your data in the app under Account → Preferences → Privacy. You may also email our privacy team at privacy@cleanupgiveback.org.',
  },
  {
    title: 'Your role',
    body: "Use a strong password you do not reuse elsewhere. Do not share your login. Turn on your phone's screen lock. Contact us right away if you think someone else accessed your account.",
  },
  {
    title: 'If something goes wrong',
    body: 'Email privacy@cleanupgiveback.org if you think your data was accessed without permission. Tell us what happened and we will investigate. We will also explain steps you can take to protect your account.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this policy when the app, our technology, or the law changes. Material updates — especially about location tracking or data collection — will be communicated through in-app notices or direct user alerts.',
  },
  {
    title: 'Contact us',
    body: 'Organization: Clean Up - Give Back. Email: privacy@cleanupgiveback.org. Mailing address: Clean Up - Give Back, Des Plaines, IL.',
  },
];
