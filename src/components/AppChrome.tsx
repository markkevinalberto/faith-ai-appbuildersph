import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useApp } from '@/state/AppState';
import { Button } from '@/ui/Button';
import { Banner } from '@/ui/Feedback';
import { AppText } from '@/ui/Text';
import { useTheme } from '@/ui/theme';

export function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '•';
}

export function ProfileButton() {
  const { profile } = useApp();
  const { c } = useTheme();
  if (!profile) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Settings and profiles. Current profile: ${profile.displayName}`}
      onPress={() => router.push('/settings')}
      hitSlop={6}
      style={[styles.avatar, { backgroundColor: profile.isDemo ? c.demoSoft : c.primarySoft, borderColor: profile.isDemo ? c.demo : c.primary }]}>
      <AppText variant="label" style={{ color: profile.isDemo ? c.demo : c.primary }}>
        {initials(profile.displayName)}
      </AppText>
    </Pressable>
  );
}

/** Browser only: warns when records are kept in memory because the browser refused its file storage. */
export function StorageBanner() {
  const { temporaryStorage } = useApp();
  if (!temporaryStorage) return null;
  return (
    <Banner
      tone="warning"
      title="Not saved in this browser"
      message="This browser would not let FAITH save records, so anything you enter is gone when you close this page. If FAITH is open in another tab or window, close it and reload. Otherwise open FAITH in Safari or Chrome itself, not inside another app, or use the Android app."
    />
  );
}

export function DemoBanner() {
  const { profile } = useApp();
  return (
    <>
      <StorageBanner />
      {profile?.isDemo ? (
        <Banner
          tone="demo"
          title="Sample data"
          message="You are viewing a fictional demo person. Nothing here is real health information, and no reminders are scheduled for it."
          action={<Button title="Switch profile" size="sm" variant="secondary" onPress={() => router.push('/settings')} />}
        />
      ) : null}
    </>
  );
}

export function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});
