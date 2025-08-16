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
  // Folder-based quote system
  quoteFolderId?: string; // Which folder to use for this alarm
  swipeRequirement?: number; // How many quotes to swipe for this specific alarm
  quoteOrderMode?: 'random' | 'sequential' | 'newest' | 'oldest'; // How to order quotes
}

export interface QuoteFolder {
  id: string;
  name: string;
  description?: string;
  color: string; // For visual distinction
  icon?: string; // Icon name
  createdAt: number;
  isDefault: boolean; // Only one default folder allowed
  quoteCount: number; // Cached count for performance
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  gradientColors?: string[];
  createdAt: number;
  folderId: string; // Links quote to a folder
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
  quotesRequired: number;
}