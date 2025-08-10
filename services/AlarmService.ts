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
    
    // Skip if we already triggered an alarm for this time
    if (currentTime === this.lastTriggeredTime) {
      return;
    }

    // Find matching alarm
    const matchingAlarm = this.currentAlarms.find(alarm => 
      alarm.enabled && 
      alarm.time === currentTime &&
      (alarm.days.length === 0 || alarm.days.includes(currentDay))
    );

    if (matchingAlarm) {
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
  async stopAlarm(alarmId: string) {
    if (this.activeAlarmId !== alarmId) {
      console.log('⚠️ Attempted to stop non-active alarm:', alarmId);
      return;
    }
    
    console.log('🛑 Stopping alarm:', alarmId);
    
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
    }, 5000);
    
    console.log('✅ Alarm stopped successfully');
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
