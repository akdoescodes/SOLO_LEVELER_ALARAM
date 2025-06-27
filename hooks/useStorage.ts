import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alarm, Quote, Settings } from '@/types';

const ALARMS_KEY = 'alarms';
const QUOTES_KEY = 'quotes';
const SETTINGS_KEY = 'settings';

const defaultSettings: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeMinutes: 5,
  quotesRequired: 3,
};

const defaultQuotes: Quote[] = [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    createdAt: Date.now(),
  },
  {
    id: '2',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    createdAt: Date.now(),
  },
  {
    id: '3',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    createdAt: Date.now(),
  },
];

export function useStorage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alarmsData, quotesData, settingsData] = await Promise.all([
        AsyncStorage.getItem(ALARMS_KEY),
        AsyncStorage.getItem(QUOTES_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      setAlarms(alarmsData ? JSON.parse(alarmsData) : []);
      setQuotes(quotesData ? JSON.parse(quotesData) : defaultQuotes);
      setSettings(settingsData ? JSON.parse(settingsData) : defaultSettings);
      setLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoaded(true);
    }
  };

  const saveAlarms = async (newAlarms: Alarm[]) => {
    try {
      await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(newAlarms));
      setAlarms(newAlarms);
    } catch (error) {
      console.error('Error saving alarms:', error);
    }
  };

  const saveQuotes = async (newQuotes: Quote[]) => {
    try {
      await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(newQuotes));
      setQuotes(newQuotes);
    } catch (error) {
      console.error('Error saving quotes:', error);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return {
    alarms,
    quotes,
    settings,
    loaded,
    saveAlarms,
    saveQuotes,
    saveSettings,
  };
}