import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAlarmService } from '@/hooks/useAlarmService';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  // 🚀 PROFESSIONAL: Initialize alarm service globally (single instance for entire app)
  const { activeAlarmId, stopAlarm, isChecking } = useAlarmService();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Log service status for debugging
  useEffect(() => {
    console.log('🏗️ Professional Alarm Service Status:', {
      activeAlarmId,
      isChecking,
      fontsLoaded
    });
  }, [activeAlarmId, isChecking, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="alarm/[id]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}