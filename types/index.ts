export interface Alarm {
  id: string;
  time: string;
  name: string;
  enabled: boolean;
  days: string[];
  soundUri?: string;
  soundName?: string;
  createdAt: number;
  startDate?: string; // ISO string for start date
  endDate?: string | null; // ISO string for end date, null means permanent
  // Snooze-related properties
  isSnoozed?: boolean;
  originalTime?: string;
  originalDays?: string[];
  snoozeDuration?: number; // Custom snooze duration in minutes
  snoozeUntilTime?: string; // The actual time when snooze should trigger (HH:mm)
  snoozeTimestamp?: number; // Timestamp for precise snooze timing
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  gradientColors?: string[];
  createdAt: number;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
  quotesRequired: number;
}