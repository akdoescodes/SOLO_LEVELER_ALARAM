import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alarm } from '@/types';

export function useAlarmManager(alarms: Alarm[], soundEnabled: boolean, vibrationEnabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeAlarmRef = useRef<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    startAlarmChecker();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSound();
    };
  }, [alarms, soundEnabled, vibrationEnabled]);

  const startAlarmChecker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      checkAlarms();
    }, 1000);
  };

  const checkAlarms = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const activeAlarm = alarms.find(alarm => 
      alarm.enabled && 
      alarm.time === currentTime &&
      (alarm.days.length === 0 || alarm.days.includes(currentDay)) &&
      activeAlarmRef.current !== alarm.id
    );

    if (activeAlarm) {
      triggerAlarm(activeAlarm);
    }
  };

  const playAlarmSound = async (alarm: Alarm) => {
    if (!soundEnabled) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Use a built-in system sound or skip sound if no custom sound is provided
      if (alarm.soundUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: alarm.soundUri },
          {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
          }
        );
        soundRef.current = sound;
      } else {
        // You can use a system sound here or create a default beep
        console.log('No custom sound provided, using system default');
      }
    } catch (error) {
      console.log('Error playing alarm sound:', error);
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
    }
  };

  const triggerAlarm = async (alarm: Alarm) => {
    activeAlarmRef.current = alarm.id;
    
    // Play alarm sound
    await playAlarmSound(alarm);
    
    // Trigger haptic feedback if enabled and not on web
    if (vibrationEnabled && Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptics not available');
      }
    }

    // Navigate to alarm screen
    router.push(`/alarm/${alarm.id}`);
  };

  const stopAlarm = async (alarmId: string) => {
    if (activeAlarmRef.current === alarmId) {
      activeAlarmRef.current = null;
      await stopSound();
    }
  };

  return {
    stopAlarm,
  };
}