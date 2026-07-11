import { Switch } from 'react-native';

const C = {
  primary: '#009540',
  borderOutline: '#bdcaba',
  thumb: '#ffffff',
} as const;

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
};

export function SessionSetupToggle({ value, onValueChange, accessibilityLabel }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: C.borderOutline, true: C.primary }}
      thumbColor={C.thumb}
      ios_backgroundColor={C.borderOutline}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
    />
  );
}

