import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export type StatusType =
  | 'approved'
  | 'under-review'
  | 'not-approved'
  | 'photo-due'
  | 'restart-required'
  | 'gps-active';

const STATUS_CONFIG: Record<StatusType, { label: string; bgClass: string; textClass: string }> = {
  'approved': { label: 'Approved', bgClass: 'bg-primary-container', textClass: 'text-on-primary-container' },
  'under-review': { label: 'Under Review', bgClass: 'bg-secondary-container', textClass: 'text-on-secondary-container' },
  'not-approved': { label: 'Not Approved', bgClass: 'bg-error-container', textClass: 'text-on-error-container' },
  'photo-due': { label: 'Photo Due', bgClass: 'bg-secondary-container', textClass: 'text-on-secondary-container' },
  'restart-required': { label: 'Restart Required', bgClass: 'bg-error-container', textClass: 'text-on-error-container' },
  'gps-active': { label: 'GPS Active', bgClass: 'bg-primary-container', textClass: 'text-on-primary-container' },
};

interface StatusTagProps {
  status: StatusType;
}

export function StatusTag({ status }: StatusTagProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Animated.View entering={FadeIn.duration(150)}>
      <View
        className={`self-start px-2.5 py-1 rounded-sm ${config.bgClass}`}
        accessibilityRole="text"
        accessibilityLabel={`${config.label} status`}
      >
        <Text className={`font-label text-[11px] font-semibold tracking-wide ${config.textClass}`}>
          {config.label}
        </Text>
      </View>
    </Animated.View>
  );
}
