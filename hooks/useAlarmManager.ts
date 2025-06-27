import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alarm } from '@/types';

export function useAlarmManager(alarms: Alarm[], soundEnabled: boolean, vibrationEnabled: boolean) {
  const intervalRef = useRef<number | null>(null);
  const activeAlarmRef = useRef<string | null>(null);
  const audioPlayer = useAudioPlayer();

  const playAlarmSound = useCallback(async (alarm: Alarm) => {
    if (!soundEnabled) return;

    try {
      // Use a built-in system sound or skip sound if no custom sound is provided
      if (alarm.soundUri) {
        // Load and play the custom sound
        audioPlayer.replace(alarm.soundUri);
        audioPlayer.loop = true;
        audioPlayer.play();
      } else {
        // You can use a system sound here or create a default beep
        console.log('No custom sound provided, using system default');
        // For now, we'll just log this - you could add a default alarm sound file
      }
    } catch (error) {
      console.log('Error playing alarm sound:', error);
    }
  }, [soundEnabled, audioPlayer]);

  const stopSound = useCallback(async () => {
    try {
      if (audioPlayer.playing) {
        audioPlayer.pause();
        audioPlayer.replace(''); // Clear the source
      }
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  }, [audioPlayer]);

  const triggerAlarm = useCallback(async (alarm: Alarm) => {
    activeAlarmRef.current = alarm.id;
    
    // Play alarm sound
    await playAlarmSound(alarm);
    
    // Trigger haptic feedback if enabled and not on web
    if (vibrationEnabled && Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        console.log('Haptics not available');
      }
    }

    // Navigate to alarm screen
    router.push(`/alarm/${alarm.id}`);
  }, [playAlarmSound, vibrationEnabled]);

  const checkAlarms = useCallback(() => {
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
  }, [alarms, triggerAlarm]);

  const startAlarmChecker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      checkAlarms();
    }, 1000);
  }, [checkAlarms]);

  useEffect(() => {
    startAlarmChecker();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSound();
    };
  }, [startAlarmChecker, stopSound]);

  const stopAlarm = useCallback(async (alarmId: string) => {
    activeAlarmRef.current = null;
    await stopSound();
  }, [stopSound]);

  return { stopAlarm };
}
