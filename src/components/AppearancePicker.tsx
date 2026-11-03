import { View } from 'react-native';

import { SETTINGS, setSetting } from '@/db/repo/profiles';
import { useApp } from '@/state/AppState';
import { APPEARANCES, setAppearance, useAppearance, type AppearanceId } from '@/ui/appearance';
import { SegmentedControl } from '@/ui/Fields';
import { AppText } from '@/ui/Text';
import { SPACE } from '@/ui/theme';

/** Light / Dark / Match phone. Applies at once everywhere and is saved on this device. */
export function AppearancePicker() {
  const { db } = useApp();
  const id = useAppearance();
  const choose = (next: AppearanceId) => {
    setAppearance(next);
    // A failed save only means the choice resets next launch; nothing to report.
    void setSetting(db, SETTINGS.appearance, next).catch(() => undefined);
  };
  return (
    <View style={{ gap: SPACE.sm }}>
      <SegmentedControl label="Appearance" options={APPEARANCES.map((a) => ({ value: a.id, label: a.label }))} value={id} onChange={choose} />
      <AppText variant="caption" tone="muted">
        Light is easiest to read in most places. “Match phone” follows your phone’s dark mode.
      </AppText>
    </View>
  );
}
