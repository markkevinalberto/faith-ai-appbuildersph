import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/AppState';
import type { IconName } from '@/ui/Button';
import { TabBarInsetContext } from '@/ui/tabInset';
import { RADIUS, cardShadow, typeface, useTheme } from '@/ui/theme';

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'vitals', title: 'Vitals', icon: 'pulse-outline', iconActive: 'pulse' },
  { name: 'medications', title: 'Medicines', icon: 'medkit-outline', iconActive: 'medkit' },
  { name: 'care', title: 'Care plan', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'ask', title: 'Ask FAITH', icon: 'sparkles-outline', iconActive: 'sparkles' },
];

/** The floating "island" tab bar: a pill detached from the screen edges. */
const BAR_HEIGHT = 68;
const SIDE = 6;

export default function TabsLayout() {
  const { profile } = useApp();
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  if (!profile) return <Redirect href="/onboarding" />;
  const lift = Math.max(insets.bottom, 10);
  // Screens pad their bottom by the bar plus its lift plus breathing room.
  const inset = BAR_HEIGHT + lift + 16;
  return (
    <TabBarInsetContext.Provider value={inset}>
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.textSubtle,
          tabBarHideOnKeyboard: true,
          tabBarStyle: [
            styles.bar,
            { bottom: lift, left: SIDE + insets.left, right: SIDE + insets.right, backgroundColor: c.surface, borderColor: c.ring },
            cardShadow(dark),
          ],
          tabBarItemStyle: styles.item,
          // Fixed size (not scaled with the text-size setting) so five labels still fit a 360 px phone.
          // Sized so "Medicines" (the longest label) fits a 360px phone without being cut off.
          tabBarLabelStyle: { fontSize: 12, letterSpacing: -0.3, marginTop: 2, ...typeface('600') },
          tabBarAllowFontScaling: false,
          sceneStyle: { backgroundColor: c.bg },
        }}>
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarAccessibilityLabel: t.title,
              tabBarIcon: ({ color, focused }) => (
                <View style={[styles.iconPill, focused && { backgroundColor: c.primarySoft }]}>
                  <Ionicons name={focused ? t.iconActive : t.icon} size={22} color={color} />
                </View>
              ),
            }}
          />
        ))}
      </Tabs>
    </TabBarInsetContext.Provider>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 2,
  },
  item: { borderRadius: RADIUS.pill, paddingHorizontal: 0 },
  iconPill: { height: 30, minWidth: 50, paddingHorizontal: 12, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
});
