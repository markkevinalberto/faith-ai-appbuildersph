import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DemoBanner, ProfileButton } from '@/components/AppChrome';
import { MarkerCard } from '@/components/MarkerCard';
import { addCustomType, latestReadings, listCustomTypes } from '@/db/repo/vitals';
import { relativeFromNow } from '@/domain/time';
import { useApp, useProfile } from '@/state/AppState';
import { useAction, useNow, useQuery } from '@/state/hooks';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/Fields';
import { Card, Divider, ListRow, PageHeader, Screen, Section } from '@/ui/Layout';
import { AppText } from '@/ui/Text';
import { RADIUS, SPACE, useTheme } from '@/ui/theme';
import { VITAL_META, readingDisplay, type BuiltInVital } from '@/ui/vitals';

/** Blood pressure and blood sugar get their own cards above; these share one compact list. */
const OTHER_VITALS: BuiltInVital[] = ['pulse', 'weight', 'temperature', 'spo2'];

export default function Vitals() {
  const profile = useProfile();
  const { db } = useApp();
  const { c } = useTheme();
  const now = useNow();
  const run = useAction();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');

  const q = useQuery(
    async (d) => ({
      latest: await latestReadings(d, profile.id),
      custom: await listCustomTypes(d, profile.id),
    }),
    [profile.id],
  );
  const data = q.data;

  const saveCustom = () =>
    run(async () => {
      if (!name.trim() || !unit.trim()) throw new Error('Enter a name and a unit, for example “Peak flow” and “L/min”.');
      await addCustomType(db, profile.id, name, unit, 1);
      setName('');
      setUnit('');
      setAdding(false);
    });

  return (
    <Screen>
      <PageHeader eyebrow="Your numbers" title="Vitals" subtitle="Log your blood pressure and blood sugar, and see which way they are heading." right={<ProfileButton />} />
      <DemoBanner />

      <MarkerCard type="blood_pressure" />
      <MarkerCard type="glucose" />
      <Card padded={false} style={{ paddingHorizontal: SPACE.lg, paddingVertical: SPACE.xs }}>
        <ListRow
          icon="document-text-outline"
          title="Weekly and monthly reports"
          subtitle="Blood pressure and blood sugar, ready to email or bring to your check-up"
          onPress={() => router.push('/vitals/report')}
        />
      </Card>

      <Section title="Other readings" hint="Pulse, weight, temperature, oxygen and anything your care team asks for.">
        <Card padded={false} style={{ paddingHorizontal: SPACE.lg, paddingVertical: SPACE.xs }}>
          {OTHER_VITALS.map((type, i) => {
            const meta = VITAL_META[type];
            const latest = data?.latest.find((r) => r.type === type);
            const disp = latest ? readingDisplay(latest, profile) : null;
            return (
              <View key={type}>
                {i > 0 ? <Divider /> : null}
                <ListRow
                  icon={meta.icon}
                  iconTone={meta.tone}
                  title={meta.label}
                  subtitle={latest ? `Latest ${relativeFromNow(latest.measuredAt, now)}` : 'No readings yet'}
                  right={
                    disp ? (
                      <AppText variant="bodyStrong">
                        {disp.value}{' '}
                        <AppText variant="caption" tone="muted">
                          {disp.unit}
                        </AppText>
                      </AppText>
                    ) : null
                  }
                  onPress={() => router.push({ pathname: '/vitals/[type]', params: { type } })}
                />
              </View>
            );
          })}
          {(data?.custom ?? []).map((t) => {
            const latest = data?.latest.find((r) => r.type === 'custom' && r.customTypeId === t.id);
            return (
              <View key={t.id}>
                <Divider />
                <ListRow
                  icon="analytics-outline"
                  iconTone="neutral"
                  title={t.name}
                  subtitle={latest ? `Latest ${relativeFromNow(latest.measuredAt, now)} · ${t.unit}` : `No readings yet · ${t.unit}`}
                  right={latest ? <AppText variant="bodyStrong">{readingDisplay(latest, profile, t).value}</AppText> : null}
                  onPress={() => router.push({ pathname: '/vitals/[type]', params: { type: 'custom', customId: t.id } })}
                />
              </View>
            );
          })}
        </Card>
        <Button title="Log another reading" icon="add" variant="secondary" onPress={() => router.push('/vitals/new')} />
        {adding ? (
          <Card style={{ gap: SPACE.md }}>
            <TextField label="Measurement name" value={name} onChangeText={setName} placeholder="e.g. Peak flow" autoCapitalize="sentences" maxLength={40} />
            <TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. L/min" autoCapitalize="none" maxLength={16} helper="Shown with every value. Units are never converted for custom measurements." />
            <View style={{ flexDirection: 'row', gap: SPACE.sm }}>
              <Button title="Cancel" variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title="Save" icon="checkmark" onPress={() => void saveCustom()} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={[styles.addRow, { borderColor: c.borderStrong }]}>
            <Ionicons name="add" size={20} color={c.primary} />
            <AppText variant="bodyStrong" tone="primary">
              Add a measurement type
            </AppText>
          </Pressable>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.sm, minHeight: 52, borderRadius: RADIUS.pill, borderWidth: 1, borderStyle: 'dashed' },
});
