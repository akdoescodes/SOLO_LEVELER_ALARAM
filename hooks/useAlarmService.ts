import { useEffect, useState, useMemo } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { alarmService } from '@/services/AlarmService';
import { useStorage } from './useStorage';

/**
 * Professional alarm hook that provides a clean interface to the AlarmService
 * This hook should only be used ONCE in your app's root component
 */
export function useAlarmService() {
  const { alarms, settings } = useStorage();
  const audioPlayer = useAudioPlayer();
  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  
  // Memoize settings to prevent unnecessary re-renders
  const stableSettings = useMemo(() => ({
    soundEnabled: settings.soundEnabled ?? true,
    vibrationEnabled: settings.vibrationEnabled ?? true
  }), [settings.soundEnabled, settings.vibrationEnabled]);
  
  // Initialize the service
  useEffect(() => {
    console.log('🔧 Initializing professional alarm service');
    alarmService.initialize(audioPlayer);
    alarmService.setOnActiveAlarmChange(setActiveAlarmId);
    
    return () => {
      console.log('🧹 Cleaning up alarm service');
      alarmService.stopChecking();
    };
  }, [audioPlayer]);
  
  // Start/stop checking based on alarms
  useEffect(() => {
    if (alarms.length > 0) {
      console.log('📊 Updating alarm service with', alarms.length, 'alarms');
      alarmService.startChecking(
        alarms, 
        stableSettings.soundEnabled, 
        stableSettings.vibrationEnabled
      );
    } else {
      console.log('📭 No alarms found, stopping service');
      alarmService.stopChecking();
    }
  }, [alarms, stableSettings.soundEnabled, stableSettings.vibrationEnabled]);
  
  // Stop alarm function
  const stopAlarm = async (alarmId: string) => {
    await alarmService.stopAlarm(alarmId);
  };
  
  return {
    activeAlarmId,
    stopAlarm,
    isChecking: alarmService.isCheckingActive()
  };
}
