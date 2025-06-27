export interface Alarm {
  id: string;
  time: string;
  name: string;
  enabled: boolean;
  days: string[];
  soundUri?: string;
  soundName?: string;
  createdAt: number;
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