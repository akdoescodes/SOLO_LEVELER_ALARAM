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
  const soundLoggedRef = useRef<Set<string>>(new Set()); // Track which alarms we've logged for
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create audio player at hook level, not inside useEffect
  const player = useAudioPlayer();
  
  // Setup and cleanup for the audio player
  useEffect(() => {
    // Store the player instance in the ref
    audioPlayerRef.current = player;
    
    console.log('Audio player created successfully');
    
    // Clean up function runs when component unmounts
    return () => {
      try {
        // Stop any playing sound
        if (audioPlayerRef.current) {
          if (audioPlayerRef.current.playing) {
            audioPlayerRef.current.pause();
          }
          
          // Clear the ref to allow garbage collection
          setTimeout(() => {
            audioPlayerRef.current = null;
          }, 100);
        }
      } catch (error) {
        console.log('Error cleaning up audio player:', error);
      }
    };
  }, [player]); // Use player as dependency to ensure proper cleanup

  const playAlarmSound = useCallback(async (alarm: Alarm) => {
    if (!soundEnabled || stoppedAlarmsRef.current.has(alarm.id)) return;

    try {
      const player = audioPlayerRef.current;
      if (!player) {
        console.log('No audio player available');
        setIsPlaying(true); // Still set playing for UI
        return;
      }
      
      // Make sure we clean up any previous player state
      try {
        if (player.playing) {
          await player.pause();
        }
      } catch (cleanupError) {
        console.log('Error cleaning up previous sound:', cleanupError);
      }

      // Use a built-in system sound or skip sound if no custom sound is provided
      if (alarm.soundUri) {
        try {
          // Load and play the custom sound with better error handling
          player.replace(alarm.soundUri);
          
          // Apply settings in a try block so one failure doesn't abort the whole process
          try {
            player.loop = true;
          } catch (loopError) {
            console.log('Error setting loop:', loopError);
          }
          
          try {
            await player.play();
          } catch (playError) {
            console.log('Error playing sound:', playError);
          }
          
          setIsPlaying(true);
        } catch (soundError) {
          console.log('Error handling sound:', soundError);
          // Still mark as playing so the alarm UI works
          setIsPlaying(true);
        }
      } else {
        // Log only once per alarm ID
        if (!soundLoggedRef.current.has(alarm.id)) {
          console.log('No custom sound provided, using system default');
          soundLoggedRef.current.add(alarm.id);
        }
        // For now, we'll just set isPlaying to true to indicate alarm is active
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error in playAlarmSound:', error);
      // Set to playing anyway so UI shows alarm is active
      setIsPlaying(true);
    }
  }, [soundEnabled]);

  const stopSound = useCallback(async () => {
    try {
      const player = audioPlayerRef.current;
      
      // Check if player is valid before accessing its properties
      if (!player || typeof player.playing === 'undefined') {
        console.log('Audio player not initialized or invalid');
        setIsPlaying(false);
        return;
      }
      
      // Create a new function to handle complete audio cleanup
      const cleanupAudio = async () => {
        try {
          // First try to pause
          if (player.playing) {
            try {
              await player.pause();
              console.log('Audio paused successfully');
            } catch (pauseError) {
              console.log('Error pausing audio (non-critical):', pauseError);
            }
          }
          
          try {
            // Reset loop property
            player.loop = false;
          } catch (loopError) {
            console.log('Error setting loop to false (non-critical):', loopError);
          }
          
          try {
            // Reset position
            player.currentTime = 0;
          } catch (timeError) {
            console.log('Error resetting currentTime (non-critical):', timeError);
          }
          
          // Some audio players have unload or release methods, but expo-audio's
          // implementation appears not to have one. We'll rely on pause and 
          // resetting properties instead.
        } catch (innerError) {
          console.log('Inner error in audio cleanup:', innerError);
        }
      };
      
      // Execute cleanup with a timeout to ensure completion
      const cleanupPromise = cleanupAudio();
      
      // Set a timeout to ensure we don't hang
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1000));
      
      // Race between normal completion and timeout
      await Promise.race([cleanupPromise, timeoutPromise]);
      
      // Always set isPlaying to false regardless of errors
      setIsPlaying(false);
    } catch (error) {
      console.log('Error in stopSound:', error);
      setIsPlaying(false);
    }
  }, []);

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
    
    // Clear the log tracking for this alarm
    soundLoggedRef.current.delete(alarmId);
    
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
