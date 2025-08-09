import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alarm } from '@/types';

export function useAlarmManager(alarms: Alarm[], soundEnabled: boolean, vibrationEnabled: boolean) {
  const intervalRef = useRef<number | null>(null);
  const activeAlarmRef = useRef<string | null>(null);
  const stoppedAlarmsRef = useRef<Set<string>>(new Set());
  const audioPlayer = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);

  const playAlarmSound = useCallback(async (alarm: Alarm) => {
    if (!soundEnabled || stoppedAlarmsRef.current.has(alarm.id)) return;

    try {
      // Stop any currently playing sound first
      if (audioPlayer.playing) {
        audioPlayer.pause();
      }

      // Use a built-in system sound or skip sound if no custom sound is provided
      if (alarm.soundUri) {
        // Load and play the custom sound
        audioPlayer.replace(alarm.soundUri);
        audioPlayer.loop = true;
        audioPlayer.play();
        setIsPlaying(true);
      } else {
        // Log only once, not continuously
        if (!isPlaying) {
          console.log('No custom sound provided, using system default');
        }
        // For now, we'll just set isPlaying to true to indicate alarm is active
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error playing alarm sound:', error);
    }
  }, [soundEnabled, audioPlayer, isPlaying]);

  const stopSound = useCallback(async () => {
    try {
      if (audioPlayer.playing) {
        audioPlayer.pause();
      }
      // Clear the audio source to ensure it stops completely
      audioPlayer.loop = false;
      // Reset to ensure clean state
      audioPlayer.currentTime = 0;
      setIsPlaying(false);
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  }, [audioPlayer]);

  const triggerAlarm = useCallback(async (alarm: Alarm) => {
    // Prevent triggering if already stopped
    if (stoppedAlarmsRef.current.has(alarm.id)) return;
    
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
      activeAlarmRef.current !== alarm.id &&
      !stoppedAlarmsRef.current.has(alarm.id)
    );

    if (activeAlarm) {
      // Mark as triggered immediately to prevent multiple triggers
      activeAlarmRef.current = activeAlarm.id;
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

  // Clear stopped alarms at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      stoppedAlarmsRef.current.clear();
      // Set up daily clearing
      const dailyTimer = setInterval(() => {
        stoppedAlarmsRef.current.clear();
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyTimer);
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, []);

  const stopAlarm = useCallback(async (alarmId: string) => {
    console.log('Stopping alarm:', alarmId);
    
    // Mark alarm as stopped to prevent reactivation
    stoppedAlarmsRef.current.add(alarmId);
    
    // Clear active alarm reference
    if (activeAlarmRef.current === alarmId) {
      activeAlarmRef.current = null;
    }
    
    // Stop the sound
    await stopSound();
    
    console.log('Alarm stopped successfully');
  }, [stopSound]);

  const snoozeAlarm = useCallback(async (alarmId: string, snoozeMinutes: number = 5) => {
    console.log(`Alarm snoozed until ${new Date(Date.now() + snoozeMinutes * 60 * 1000).toLocaleTimeString()}`);
    
    // Stop the current alarm
    await stopAlarm(alarmId);
    
    // Remove from stopped alarms after snooze time to allow it to ring again
    setTimeout(() => {
      stoppedAlarmsRef.current.delete(alarmId);
    }, snoozeMinutes * 60 * 1000);
  }, [stopAlarm]);

  return { 
    stopAlarm,
    snoozeAlarm,
    isPlaying
  };
}
