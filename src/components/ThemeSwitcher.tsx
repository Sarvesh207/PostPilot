import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePref } from '../lib/theme';
import { SegmentedControl, type SegmentOption } from './ui/SegmentedControl';

const OPTIONS: SegmentOption<ThemePref>[] = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
];

export function ThemeSwitcher({ compact = false, fullWidth = false }: { compact?: boolean; fullWidth?: boolean }) {
  const { pref, setPref } = useTheme();
  return (
    <SegmentedControl
      aria-label="Theme"
      size="sm"
      fullWidth={fullWidth}
      value={pref}
      onChange={setPref}
      options={compact ? OPTIONS.map((o) => ({ ...o, iconOnly: true })) : OPTIONS}
    />
  );
}
