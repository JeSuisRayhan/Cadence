import { BricolageGrotesque_500Medium } from '@expo-google-fonts/bricolage-grotesque/500Medium';
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium';
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold';
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureNotifications } from '../notifications';
import { useNotificationTaps, useReminderSync } from '../notifications/useReminderSync';
import { useStoreHydrated } from '../store';
import { colors, fonts } from '../theme';

void SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.displayMedium]: BricolageGrotesque_500Medium,
    [fonts.displaySemi]: BricolageGrotesque_600SemiBold,
    [fonts.display]: BricolageGrotesque_700Bold,
    [fonts.body]: InstrumentSans_400Regular,
    [fonts.bodyMedium]: InstrumentSans_500Medium,
    [fonts.bodySemi]: InstrumentSans_600SemiBold,
    [fonts.bodyBold]: InstrumentSans_700Bold,
  });
  const hydrated = useStoreHydrated();
  const ready = (fontsLoaded || fontError != null) && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useReminderSync(hydrated);
  useNotificationTaps(ready);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="creation" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="rappel" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="musique" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="seance/[id]/en-cours" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="fin/[logId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
