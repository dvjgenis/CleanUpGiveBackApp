"use client";

/**
 * Icon set — primarily Lucide (`react-icons/lu`), matching
 * `admin/components/ui/Icons.tsx`. Password reveal uses `react-icons/io5`
 * (`IoEye` / `IoEyeOff`) to match mobile onboarding. Keep named exports stable.
 */
import type { IconType } from "react-icons";
import { IoEye, IoEyeOff } from "react-icons/io5";
import {
  LuBell,
  LuCalendar,
  LuCalendarDays,
  LuCamera,
  LuChartColumn,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
  LuCopy,
  LuCreditCard,
  LuHouse,
  LuMail,
  LuMaximize2,
  LuMenu,
  LuMessageSquare,
  LuMinimize2,
  LuMapPin,
  LuPause,
  LuPlay,
  LuRotateCcw,
  LuShoppingBag,
  LuUpload,
  LuUser,
  LuUsers,
  LuX,
} from "react-icons/lu";

export interface IconProps {
  className?: string;
  color?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

function makeIcon(Icon: IconType) {
  function Wrapped({ className, color = "currentColor", ...rest }: IconProps) {
    return <Icon className={className} color={color} aria-hidden {...rest} />;
  }
  Wrapped.displayName =
    (Icon as { displayName?: string; name?: string }).displayName ??
    (Icon as { name?: string }).name ??
    "Icon";
  return Wrapped;
}

export const HomeIcon = makeIcon(LuHouse);
export const SessionsIcon = makeIcon(LuClipboardList);
export const SessionIcon = SessionsIcon;
export const VolunteerIcon = makeIcon(LuUsers);
export const InsightsIcon = makeIcon(LuChartColumn);
export const FeedbackIcon = makeIcon(LuMessageSquare);
export const EventsIcon = makeIcon(LuCalendar);
export const EventIcon = EventsIcon;
export const OrdersIcon = makeIcon(LuShoppingBag);
export const OrderIcon = OrdersIcon;
export const PaymentsIcon = makeIcon(LuCreditCard);
export const PaymentIcon = PaymentsIcon;
export const AccountIcon = makeIcon(LuUser);
export const BellIcon = makeIcon(LuBell);
export const MenuIcon = makeIcon(LuMenu);
export const CloseIcon = makeIcon(LuX);
export const CalendarIcon = makeIcon(LuCalendarDays);
export const ChevronRightIcon = makeIcon(LuChevronRight);
export const ChevronLeftIcon = makeIcon(LuChevronLeft);
export const ChevronDownIcon = makeIcon(LuChevronDown);
export const MapPinIcon = makeIcon(LuMapPin);
export const UploadIcon = makeIcon(LuUpload);
export const CameraIcon = makeIcon(LuCamera);
export const ExpandIcon = makeIcon(LuMaximize2);
export const CollapseIcon = makeIcon(LuMinimize2);
export const MailIcon = makeIcon(LuMail);
export const CopyIcon = makeIcon(LuCopy);
export const PlayIcon = makeIcon(LuPlay);
export const PauseIcon = makeIcon(LuPause);
export const ReplayIcon = makeIcon(LuRotateCcw);
/** Password reveal — `react-icons/io5`, same pack as mobile onboarding. */
export const EyeIcon = makeIcon(IoEye);
export const EyeOffIcon = makeIcon(IoEyeOff);
