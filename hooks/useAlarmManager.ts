import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alarm } from '@/types';

export function useAlarmManager(alarms: Alarm[], soundEnabled: boolean, vibrationEnabled: boolean) {
  // Alarm state refs
  const intervalRef = useRef<number | null>(null);
  const activeAlarmRef = useRef<string | null>(null);
  const alarmTriggeredRef = useRef<boolean>(false);
  const audioPlayer = useAudioPlayer();
  
  // Timing control variables
  const THROTTLE_INTERVAL = 500;  // Check at most every 500ms
  const DEBOUNCE_INTERVAL = 3000; // 3 seconds between triggers
  const OPTIMAL_CHECK_INTERVAL = 1000; // Optimal interval for regular checks
  
  // Timing state references
  const lastCheckTimeRef = useRef<number>(0);
  const lastTriggerAttemptRef = useRef<number>(0);
  const nextScheduledCheckRef = useRef<number>(0);
  
  // Track last triggered time to prevent double triggers
  const lastTriggeredTimeRef = useRef<string>('');

  // Start the alarm checking interval with adaptive timing
  const startAlarmChecker = useCallback((checkFn: () => void) => {
    console.log('Starting/restarting alarm checker with adaptive timing');
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Use the optimal check interval to balance performance and responsiveness
    intervalRef.current = setInterval(() => {
      // Calculate time until next optimal check
      const now = Date.now();
      const timeUntilNextCheck = Math.max(0, nextScheduledCheckRef.current - now);
      
      // If we're close to the next optimal check time or past it, run check now
      // Otherwise, we'll skip this iteration (throttling)
      if (timeUntilNextCheck < THROTTLE_INTERVAL/2) {
        checkFn();
      }
    }, THROTTLE_INTERVAL);
    
    // Run an initial check immediately
    checkFn();
  }, []);

  // Function to play the alarm sound
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

  // Function to stop the sound
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

  // Function to trigger the alarm
  const triggerAlarm = useCallback(async (alarm: Alarm) => {
    // Forced log to help with debugging
    console.log('Attempting to trigger alarm:', alarm.id);
    
    // Prevent re-triggering navigation if this alarm is already active or triggered
    if (activeAlarmRef.current === alarm.id || alarmTriggeredRef.current) {
      console.log('Alarm already triggered, skipping:', alarm.id);
      return;
    }
    
    // We've removed the debounce check here because it was preventing alarms from triggering
    // The debounce protection in checkAlarms is sufficient
    
    console.log('Triggering alarm:', alarm.id);
    console.log('*** ALARM TRIGGERED FOR TIME ' + new Date().toLocaleTimeString() + ' ***');
    
    try {
      // Set flags before any async operations to prevent race conditions
      activeAlarmRef.current = alarm.id;
      alarmTriggeredRef.current = true;
      
      // IMPORTANT: Pause the alarm checking interval while alarm is active
      // This prevents the loop from continuing to evaluate while we're handling the alarm
      if (intervalRef.current) {
        console.log('Pausing alarm checker while alarm is active');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Play alarm sound first
      await playAlarmSound(alarm);
      
      // Short delay to ensure sound starts playing before navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Trigger initial haptic feedback if enabled and not on web
      if (vibrationEnabled && Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (err) {
          console.log('Haptics not available:', err);
        }
      }
      
      // Navigate to alarm screen - add additional safety to ensure navigation occurs
      console.log('Navigating to alarm screen for:', alarm.id);
      
      try {
        // Force navigation with replace to avoid back stack issues
        router.replace(`/alarm/${alarm.id}`);
        console.log('Navigation successful');
      } catch (navError) {
        console.log('Navigation error:', navError);
        
        // Try alternative navigation method if the first fails
        setTimeout(() => {
          console.log('Attempting alternative navigation method');
          router.push(`/alarm/${alarm.id}`);
        }, 300);
      }
    } catch (error) {
      console.log('Error triggering alarm:', error);
      // Reset flags if anything fails so we can try again
      if (activeAlarmRef.current === alarm.id) {
        console.log('Resetting alarm trigger flags due to error');
        activeAlarmRef.current = null;
        alarmTriggeredRef.current = false;
      }
    }
  }, [playAlarmSound, vibrationEnabled]);

  // Check if any alarms should be triggered (with throttling)
  const checkAlarms = useCallback(() => {
    const now = Date.now();
    
    // THROTTLING: Skip if we've checked too recently
    if (now - lastCheckTimeRef.current < THROTTLE_INTERVAL) {
      return;
    }
    
    // Update the last check timestamp
    lastCheckTimeRef.current = now;
    
    // Schedule next optimal check time
    nextScheduledCheckRef.current = now + OPTIMAL_CHECK_INTERVAL;
    
    // Skip check if an alarm is already active or being handled
    if (activeAlarmRef.current || alarmTriggeredRef.current) {
      return;
    }
    
    // DEBOUNCING: Skip trigger attempts if too recent
    if (now - lastTriggerAttemptRef.current < DEBOUNCE_INTERVAL) {
      // Only log once every few seconds to avoid console spam
      if (now % 3000 < 100) {
        console.log('Debouncing alarm check - too soon after last attempt');
      }
      return;
    }
    
    const nowDate = new Date();
    const currentTime = `${nowDate.getHours().toString().padStart(2, '0')}:${nowDate.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = nowDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Add time tracking to ensure we only trigger once per minute
    const currentMinute = `${nowDate.getHours()}:${nowDate.getMinutes()}`;

    // Skip if we already triggered an alarm in this minute
    if (currentTime === lastTriggeredTimeRef.current) {
      return;
    }

    const activeAlarm = alarms.find(alarm => 
      alarm.enabled && 
      alarm.time === currentTime &&
      (alarm.days.length === 0 || alarm.days.includes(currentDay))
    );

    if (activeAlarm) {
      // First update lastTriggeredTimeRef to prevent duplicate triggers
      lastTriggeredTimeRef.current = currentTime;
      
      // Then trigger the alarm (update lastTriggerAttemptRef only AFTER alarm has been triggered)
      console.log('Found matching alarm:', activeAlarm.id, 'at time:', currentTime);
      
      // Don't update lastTriggerAttemptRef until after navigation completes
      // This allows the alarm to trigger immediately without being debounced
      triggerAlarm(activeAlarm);
      
      // Now update the attempt timestamp (this prevents rapid subsequent attempts)
      lastTriggerAttemptRef.current = now;
    }
  }, [alarms, triggerAlarm]);

  // Start checking for alarms when the hook mounts
  useEffect(() => {
    // Start the alarm checker with our checkAlarms function
    startAlarmChecker(checkAlarms);
    
    // Safety check: if the alarm checker somehow gets disabled, restart it
    const safetyInterval = setInterval(() => {
      if (!intervalRef.current && !activeAlarmRef.current) {
        console.log('Safety restart: Alarm checker was disabled unexpectedly');
        startAlarmChecker(checkAlarms);
      }
    }, 10000); // Check every 10 seconds
    
    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearInterval(safetyInterval);
      stopSound();
    };
  }, [startAlarmChecker, checkAlarms, stopSound]);

  // Function to stop an active alarm
  const stopAlarm = useCallback(async (alarmId: string) => {
    console.log('Stopping alarm:', alarmId);
    
    // Stop sound first
    await stopSound();
    
    // Reset all alarm state and timing references
    activeAlarmRef.current = null;
    alarmTriggeredRef.current = false;
    
    // Reset all timing references
    lastCheckTimeRef.current = 0;
    lastTriggerAttemptRef.current = 0;
    nextScheduledCheckRef.current = 0;
    lastTriggeredTimeRef.current = '';
    
    // Restart the alarm checker
    startAlarmChecker(checkAlarms);
    
  }, [stopSound, startAlarmChecker, checkAlarms]);

  return { stopAlarm };
}
