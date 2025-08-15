import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alarm, Quote, Settings, QuoteFolder } from '@/types';

const ALARMS_KEY = 'alarms';
const QUOTES_KEY = 'quotes';
const SETTINGS_KEY = 'settings';
const QUOTE_FOLDERS_KEY = 'quote_folders';

const defaultSettings: Settings = {
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeMinutes: 5,
  quotesRequired: 3,
};

// Default folders with some initial quotes
const defaultFolders: QuoteFolder[] = [
  {
    id: 'default',
    name: 'General Motivation',
    description: 'Classic motivational quotes to start your day',
    color: '#4facfe', // Blue theme color
    icon: 'star',
    createdAt: Date.now(),
    isDefault: true,
    quoteCount: 3,
  },
];

const defaultQuotes: Quote[] = [
  {
    id: '1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    createdAt: Date.now(),
    folderId: 'default',
  },
  {
    id: '2',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    createdAt: Date.now(),
    folderId: 'default',
  },
  {
    id: '3',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    createdAt: Date.now(),
    folderId: 'default',
  },
];

export function useStorage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteFolders, setQuoteFolders] = useState<QuoteFolder[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [alarmsData, quotesData, settingsData, foldersData] = await Promise.all([
        AsyncStorage.getItem(ALARMS_KEY),
        AsyncStorage.getItem(QUOTES_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(QUOTE_FOLDERS_KEY),
      ]);

      setAlarms(alarmsData ? JSON.parse(alarmsData) : []);
      
      // Load and migrate folders
      const loadedFolders = foldersData ? JSON.parse(foldersData) : defaultFolders;
      // Ensure default folder has the correct blue color
      const migratedFolders = loadedFolders.map((folder: QuoteFolder) => ({
        ...folder,
        // Update default folder to blue color if it's still the old purple
        color: folder.isDefault ? '#4facfe' : folder.color,
      }));
      setQuoteFolders(migratedFolders);
      
      // Save the migrated folders to persist the blue color change
      if (foldersData && migratedFolders.some((f: QuoteFolder) => f.isDefault && f.color === '#4facfe')) {
        await AsyncStorage.setItem(QUOTE_FOLDERS_KEY, JSON.stringify(migratedFolders));
      }
      
      // Handle quote migration - if quotes don't have folderId, assign to default
      const loadedQuotes = quotesData ? JSON.parse(quotesData) : defaultQuotes;
      const migratedQuotes = loadedQuotes.map((quote: Quote) => ({
        ...quote,
        folderId: quote.folderId || 'default', // Migrate existing quotes to default folder
      }));
      setQuotes(migratedQuotes);
      
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
      
      // Update folder quote counts
      await updateFolderCounts(newQuotes);
    } catch (error) {
      console.error('Error saving quotes:', error);
    }
  };

  const saveQuoteFolders = async (newFolders: QuoteFolder[]) => {
    try {
      await AsyncStorage.setItem(QUOTE_FOLDERS_KEY, JSON.stringify(newFolders));
      setQuoteFolders(newFolders);
    } catch (error) {
      console.error('Error saving quote folders:', error);
    }
  };

  const updateFolderCounts = async (currentQuotes: Quote[]) => {
    try {
      const updatedFolders = quoteFolders.map(folder => ({
        ...folder,
        quoteCount: currentQuotes.filter(quote => quote.folderId === folder.id).length,
      }));
      await saveQuoteFolders(updatedFolders);
    } catch (error) {
      console.error('Error updating folder counts:', error);
    }
  };

  // Helper functions for folder operations
  const getQuotesByFolderId = (folderId: string) => {
    return quotes.filter(quote => quote.folderId === folderId);
  };

  const getDefaultFolder = () => {
    return quoteFolders.find(folder => folder.isDefault) || quoteFolders[0];
  };

  const createFolder = async (name: string, description: string, color: string) => {
    const newFolder: QuoteFolder = {
      id: Date.now().toString(),
      name,
      description,
      color,
      createdAt: Date.now(),
      isDefault: false,
      quoteCount: 0,
    };
    
    const updatedFolders = [...quoteFolders, newFolder];
    await saveQuoteFolders(updatedFolders);
    return newFolder;
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
    quoteFolders,
    settings,
    loaded,
    saveAlarms,
    saveQuotes,
    saveQuoteFolders,
    saveSettings,
    getQuotesByFolderId,
    getDefaultFolder,
    createFolder,
  };
}