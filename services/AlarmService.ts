import { AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Alarm } from '@/types';

export class AlarmService {
  private static instance: AlarmService;
  private intervalId: number | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private activeAlarmId: string | null = null;
  private isChecking: boolean = false;
  
  // Configuration
  private readonly CHECK_INTERVAL = 1000; // 1 second
  private lastTriggeredTime: string = '';
  
  // Store current alarm data
  private currentAlarms: Alarm[] = [];
  private currentSoundEnabled: boolean = true;
  private currentVibrationEnabled: boolean = true;
  
  // Callbacks for state updates
  private onActiveAlarmChange: ((alarmId: string | null) => void) | null = null;
  
  private constructor() {}
  
  static getInstance(): AlarmService {
    if (!AlarmService.instance) {
      AlarmService.instance = new AlarmService();
    }
    return AlarmService.instance;
  }
  
  // Initialize the service with audio player
  initialize(audioPlayer: AudioPlayer) {
    this.audioPlayer = audioPlayer;
  }
  
  // Set callback for when active alarm changes
  setOnActiveAlarmChange(callback: (alarmId: string | null) => void) {
    this.onActiveAlarmChange = callback;
  }
  
  // Start alarm checking
  startChecking(alarms: Alarm[], soundEnabled: boolean, vibrationEnabled: boolean) {
    // Update current settings
    this.currentAlarms = alarms;
    this.currentSoundEnabled = soundEnabled;
    this.currentVibrationEnabled = vibrationEnabled;
    
    if (this.isChecking) {
      // Already checking, just update the data
      console.log('🔄 Updating alarm service with', alarms.length, 'alarms');
      return;
    }
    
    console.log('🚀 Starting professional alarm service with', alarms.length, 'alarms');
    this.isChecking = true;
    
    this.intervalId = setInterval(() => {
      this.checkAlarms();
    }, this.CHECK_INTERVAL);
    
    // Run initial check
    this.checkAlarms();
  }
  
  // Stop alarm checking
  stopChecking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isChecking = false;
    console.log('⏹️ Stopped alarm service');
  }
  
  // Check for alarms that should trigger
  private checkAlarms() {
    // Skip if an alarm is already active
    if (this.activeAlarmId) {
      return;
    }
    
    // Skip if no alarms to check
    if (this.currentAlarms.length === 0) {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTimestamp = now.getTime();
    
    // Skip if we already triggered an alarm for this time (but not for snoozed alarms)
    if (currentTime === this.lastTriggeredTime) {
      // Check for snoozed alarms that should trigger now
      const snoozedAlarm = this.currentAlarms.find(alarm => 
        alarm.enabled && 
        alarm.isSnoozed &&
        alarm.snoozeTimestamp &&
        currentTimestamp >= alarm.snoozeTimestamp &&
        currentTimestamp < alarm.snoozeTimestamp + 60000 // Within 1 minute window
      );
      
      if (snoozedAlarm) {
        console.log('🔔 Snoozed alarm should trigger:', snoozedAlarm.id);
        this.triggerAlarm(snoozedAlarm);
      }
      return;
    }

    // Find matching regular alarm
    const matchingAlarm = this.currentAlarms.find(alarm => 
      alarm.enabled && 
      !alarm.isSnoozed && // Regular alarms only
      alarm.time === currentTime &&
      (alarm.days.length === 0 || alarm.days.includes(currentDay))
    );

    // Check for snoozed alarms that should trigger now
    const snoozedAlarm = this.currentAlarms.find(alarm => 
      alarm.enabled && 
      alarm.isSnoozed &&
      alarm.snoozeTimestamp &&
      currentTimestamp >= alarm.snoozeTimestamp &&
      currentTimestamp < alarm.snoozeTimestamp + 60000 // Within 1 minute window
    );

    if (snoozedAlarm) {
      console.log('🔔 Professional alarm service found snoozed alarm:', snoozedAlarm.id);
      this.triggerAlarm(snoozedAlarm);
    } else if (matchingAlarm) {
      console.log('🔔 Professional alarm service found matching alarm:', matchingAlarm.id);
      this.triggerAlarm(matchingAlarm);
    }
  }
  
  // Trigger an alarm
  private async triggerAlarm(alarm: Alarm) {
    try {
      // Mark alarm as active and stop checking
      this.activeAlarmId = alarm.id;
      this.lastTriggeredTime = alarm.time;
      this.stopChecking();
      
      // Notify listeners
      if (this.onActiveAlarmChange) {
        this.onActiveAlarmChange(alarm.id);
      }
      
      console.log('🚨 TRIGGERING ALARM:', alarm.id);
      
      // Play sound if enabled
      if (this.currentSoundEnabled && this.audioPlayer && alarm.soundUri) {
        this.audioPlayer.replace(alarm.soundUri);
        this.audioPlayer.loop = true;
        this.audioPlayer.play();
      }
      
      // Trigger haptics if enabled
      if (this.currentVibrationEnabled && Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
          console.log('Haptics not available:', error);
        }
      }
      
      // Navigate to alarm screen
      router.replace(`/alarm/${alarm.id}`);
      
    } catch (error) {
      console.error('Error triggering alarm:', error);
      // Reset state on error
      this.activeAlarmId = null;
      this.startChecking(this.currentAlarms, this.currentSoundEnabled, this.currentVibrationEnabled);
    }
  }
  
  // Stop the current alarm
  async stopAlarm(alarmId: string, options?: { isSnooze?: boolean }) {
    if (this.activeAlarmId !== alarmId) {
      console.log('⚠️ Attempted to stop non-active alarm:', alarmId);
      return;
    }
    
    console.log('🛑 Stopping alarm:', alarmId, options?.isSnooze ? '(snooze)' : '');
    
    // Stop sound
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.replace('');
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
    }
    
    // Clear active state
    this.activeAlarmId = null;
    
    // Notify listeners
    if (this.onActiveAlarmChange) {
      this.onActiveAlarmChange(null);
    }
    
    // Reset last triggered time after a delay to prevent immediate re-trigger
    setTimeout(() => {
      this.lastTriggeredTime = '';
    }, options?.isSnooze ? 1000 : 5000); // Shorter delay for snooze
    
    console.log('✅ Alarm stopped successfully');
  }

  // Snooze the current alarm
  async snoozeAlarm(alarmId: string, snoozeDurationMinutes: number = 5): Promise<Alarm | null> {
    if (this.activeAlarmId !== alarmId) {
      console.log('⚠️ Attempted to snooze non-active alarm:', alarmId);
      return null;
    }

    console.log('😴 Snoozing alarm:', alarmId, 'for', snoozeDurationMinutes, 'minutes');

    try {
      // Find the alarm in current alarms
      const alarmIndex = this.currentAlarms.findIndex(a => a.id === alarmId);
      if (alarmIndex === -1) {
        console.log('⚠️ Could not find alarm to snooze:', alarmId);
        return null;
      }

      const originalAlarm = this.currentAlarms[alarmIndex];
      
      // Calculate snooze time
      const now = new Date();
      const snoozeUntil = new Date(now.getTime() + snoozeDurationMinutes * 60 * 1000);
      const snoozeTime = `${snoozeUntil.getHours().toString().padStart(2, '0')}:${snoozeUntil.getMinutes().toString().padStart(2, '0')}`;
      
      // Create a snoozed alarm that keeps original display time but has internal snooze logic
      const snoozedAlarm: Alarm = {
        ...originalAlarm,
        // Keep original time for display purposes
        time: originalAlarm.time,
        // Store snooze information
        isSnoozed: true,
        originalTime: originalAlarm.originalTime || originalAlarm.time,
        originalDays: originalAlarm.originalDays || originalAlarm.days,
        snoozeDuration: snoozeDurationMinutes,
        // Add snooze metadata for internal use
        snoozeUntilTime: snoozeTime,
        snoozeTimestamp: snoozeUntil.getTime(),
      };

      // Replace the alarm in our current alarms array
      this.currentAlarms[alarmIndex] = snoozedAlarm;

      // Stop the current alarm
      await this.stopAlarm(alarmId, { isSnooze: true });

      // Restart checking with updated alarms
      this.startChecking(this.currentAlarms, this.currentSoundEnabled, this.currentVibrationEnabled);

      console.log('😴 Alarm snoozed successfully until:', snoozeTime);
      return snoozedAlarm;
    } catch (error) {
      console.error('Error snoozing alarm:', error);
      return null;
    }
  }

  // Get alarm by ID (helper method)
  private getAlarmById(alarmId: string): Alarm | undefined {
    return this.currentAlarms.find(alarm => alarm.id === alarmId);
  }

  // Restore alarm to original settings (after snooze period)
  restoreOriginalAlarm(alarmId: string): Alarm | null {
    const alarmIndex = this.currentAlarms.findIndex(a => a.id === alarmId);
    if (alarmIndex === -1) return null;

    const snoozedAlarm = this.currentAlarms[alarmIndex];
    if (!snoozedAlarm.isSnoozed || !snoozedAlarm.originalTime) return null;

    // Restore original alarm settings
    const restoredAlarm: Alarm = {
      ...snoozedAlarm,
      time: snoozedAlarm.originalTime,
      days: snoozedAlarm.originalDays || [],
      isSnoozed: false,
      originalTime: undefined,
      originalDays: undefined,
      snoozeDuration: undefined,
      snoozeUntilTime: undefined,
      snoozeTimestamp: undefined,
    };

    // Update in current alarms
    this.currentAlarms[alarmIndex] = restoredAlarm;

    console.log('🔄 Restored alarm to original settings:', restoredAlarm.time);
    return restoredAlarm;
  }

  // Format time to HH:mm format (helper method)
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // Get current active alarm ID
  getActiveAlarmId(): string | null {
    return this.activeAlarmId;
  }

  // Check if service is currently checking for alarms
  isCheckingActive(): boolean {
    return this.isChecking;
  }
}

// Export singleton instance
export const alarmService = AlarmService.getInstance();
