import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppLockProvider } from '@/state/AppLock';
import { AppStateProvider } from '@/state/AppState';
import { ReminderCoordinator } from '@/state/ReminderCoordinator';
import { setFontsReady, typeface, useTheme } from '@/ui/theme';
import { installWebStyles } from '@/ui/webStyles';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
installWebStyles();

export default function RootLayout() {
  const { c, dark } = useTheme();
  // The splash stays up while the fonts load (AppState hides it once the records are open). If a
  // font fails to load, FAITH carries on in the system font rather than waiting.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  setFontsReady(fontsLoaded);
  if (!fontsLoaded && !fontError) return null;
  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.bg, card: c.bg, text: c.text, border: c.border, notification: c.danger },
  };
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <AppStateProvider>
        <AppLockProvider>
          <ReminderCoordinator />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: c.bg },
              headerTintColor: c.text,
              headerShadowVisible: false,
              headerTitleStyle: { ...typeface('700'), fontSize: 18 },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: c.bg },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/profile" options={{ title: 'Profile' }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="vitals/[type]" options={{ title: '' }} />
            <Stack.Screen name="vitals/new" options={{ presentation: 'modal', title: 'Reading' }} />
            <Stack.Screen name="medications/[id]" options={{ title: '' }} />
            <Stack.Screen name="medications/edit" options={{ presentation: 'modal', title: 'Medication' }} />
            <Stack.Screen name="dose/[id]" options={{ presentation: 'modal', title: 'Dose' }} />
            <Stack.Screen name="care/lab/[id]" options={{ title: '' }} />
            <Stack.Screen name="care/lab/edit" options={{ presentation: 'modal', title: 'Lab test' }} />
            <Stack.Screen name="care/appointment/[id]" options={{ title: '' }} />
            <Stack.Screen name="care/appointment/edit" options={{ presentation: 'modal', title: 'Appointment' }} />
            <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
            <Stack.Screen name="settings/profile" options={{ title: 'Profile & conditions' }} />
            <Stack.Screen name="settings/targets" options={{ title: 'Target ranges' }} />
            <Stack.Screen name="settings/model" options={{ title: 'On-device AI' }} />
            <Stack.Screen name="settings/online" options={{ title: 'Online assistant' }} />
            <Stack.Screen name="settings/data" options={{ title: 'Your data' }} />
            <Stack.Screen name="settings/about" options={{ title: 'About & disclosures' }} />
          </Stack>
        </AppLockProvider>
      </AppStateProvider>
    </ThemeProvider>
  );
}
