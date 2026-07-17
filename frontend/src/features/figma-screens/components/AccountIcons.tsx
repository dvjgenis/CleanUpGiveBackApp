import { Image, type ImageStyle } from 'expo-image';
import type { DimensionValue, StyleProp } from 'react-native';

type AssetIconProps = {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

function AssetIcon({
  source,
  width,
  height,
  style,
}: AssetIconProps & { source: number }) {
  return (
    <Image
      source={source}
      style={[{ width: width as DimensionValue, height: height as DimensionValue }, style]}
      contentFit="contain"
      pointerEvents="none"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Records section — `folder.svg` */
export function RecordsFolderIcon({ width = 17, height = 14, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/folder.svg')}
      width={width ?? 17}
      height={height ?? 14}
      style={style}
    />
  );
}

/** Export Service Record — `export.svg` */
export function ExportRecordIcon({ width = 14, height = 14, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/export.svg')}
      width={width ?? 14}
      height={height ?? 14}
      style={style}
    />
  );
}

/** Approval History — `approval.svg` */
export function ApprovalHistoryIcon({ width = 15, height = 15, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/approval.svg')}
      width={width ?? 15}
      height={height ?? 15}
      style={style}
    />
  );
}

/** Request Data — `data.svg` */
export function RequestDataIcon({ width = 15, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/data.svg')}
      width={width ?? 15}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Shop section — `shop.svg` */
export function ShopBagIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/shop.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Order History — `order-history.svg` */
export function OrderHistoryIcon({ width = 15, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/order-history.svg')}
      width={width ?? 15}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Donation History — `donation.svg` */
export function DonationHistoryIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/donation.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Donation History card — hand + heart (`donate-history-icon.svg`) */
export function DonateCardIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/donate-history-icon.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Preferences section — `preferences.svg` */
export function PreferencesIcon({ width = 15, height = 15, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/preferences.svg')}
      width={width ?? 15}
      height={height ?? 15}
      style={style}
    />
  );
}

/** Notifications row — `notification.svg` */
export function NotificationsRowIcon({ width = 14, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/notification.svg')}
      width={width ?? 14}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Privacy row — `privacy.svg` */
export function PrivacyRowIcon({ width = 14, height = 17, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/privacy.svg')}
      width={width ?? 14}
      height={height ?? 17}
      style={style}
    />
  );
}

/** Permissions section — `permissions.svg` */
export function PermissionsLockIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/permissions.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Camera Access — `photos.svg` */
export function CameraAccessIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/photos.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Location Access — `location.svg` */
export function LocationAccessIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/location.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Row chevron — `chevron-right.svg` */
export function AccountChevronIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/chevron-right.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Log Out — `react-icons/io5/IoLogOut.svg` */
export function LogOutIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/io5/IoLogOut.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Delete Account — `react-icons/md/MdDelete.svg` */
export function DeleteAccountIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/md/MdDelete.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Copyright — `copyright.svg` */
export function CopyrightIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/copyright.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Warning triangle — `react-icons/bs/BsExclamationTriangleFill.svg` */
export function WarningTriangleIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/bs/BsExclamationTriangleFill.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Selected radio — `react-icons/cg/CgRadioChecked.svg` */
export function RadioCheckedIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/cg/CgRadioChecked.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Unselected radio — `radio-empty.svg` */
export function RadioEmptyIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/radio-empty.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Request sent success — `data-request-sent-check.svg` */
export function DataRequestSentCheckIcon({ width = 79, height = 79, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/data-request-sent-check.svg')}
      width={width ?? 79}
      height={height ?? 79}
      style={style}
    />
  );
}

/** Export record success — `export-record-success-check.svg` */
export function ExportRecordSuccessCheckIcon({
  width = 79,
  height = 79,
  style,
}: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/export-record-success-check.svg')}
      width={width ?? 79}
      height={height ?? 79}
      style={style}
    />
  );
}

/** Email receipt chip — `react-icons/md/MdEmail.svg` */
export function EmailReceiptIcon({ width = 16, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/react-icons/md/MdEmail.svg')}
      width={width ?? 16}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Give Feedback — reuses chat glyph from feedback screen assets */
export function GiveFeedbackIcon({ width = 18, height = 16, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/Chat.svg')}
      width={width ?? 18}
      height={height ?? 16}
      style={style}
    />
  );
}

/** Profile hero — large leaf (Figma `569:917`, 57.6×57.6, rotated −75°) */
export function ProfileLeafLargeIcon({ width = 58, height = 58, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/leaf-large.svg')}
      width={width ?? 58}
      height={height ?? 58}
      style={style}
    />
  );
}

/** Profile hero — small leaf (Figma `569:918`, 40.32×40.32, rotated −50°) */
export function ProfileLeafSmallIcon({ width = 40, height = 40, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('../../../../assets/figma/account/leaf-small.svg')}
      width={width ?? 40}
      height={height ?? 40}
      style={style}
    />
  );
}
