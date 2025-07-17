import AsyncStorage from '@react-native-async-storage/async-storage';

interface WakeUpRecord {
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  timestamp: number;
}

const WAKE_UP_STATS_KEY = 'wake_up_stats';
const MAX_RECORDS = 7; // Keep last 7 wake-ups for average calculation

export class WakeUpStatsManager {
  static async recordWakeUp(): Promise<void> {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().substring(0, 5); // HH:MM
    const timestamp = now.getTime();

    const newRecord: WakeUpRecord = {
      date,
      time,
      timestamp
    };

    try {
      const existingData = await AsyncStorage.getItem(WAKE_UP_STATS_KEY);
      const records: WakeUpRecord[] = existingData ? JSON.parse(existingData) : [];
      
      // Add new record
      records.push(newRecord);
      
      // Keep only the last MAX_RECORDS entries
      const trimmedRecords = records.slice(-MAX_RECORDS);
      
      await AsyncStorage.setItem(WAKE_UP_STATS_KEY, JSON.stringify(trimmedRecords));
    } catch (error) {
      console.error('Error recording wake-up:', error);
    }
  }

  static async getStreak(): Promise<number> {
    try {
      const existingData = await AsyncStorage.getItem(WAKE_UP_STATS_KEY);
      if (!existingData) return 0;

      const records: WakeUpRecord[] = JSON.parse(existingData);
      if (records.length === 0) return 0;

      // Sort records by date (newest first)
      const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp);
      
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Check if there's a wake-up today or yesterday
      const hasRecentWakeUp = sortedRecords.some(record => 
        record.date === today || record.date === yesterday
      );
      
      if (!hasRecentWakeUp) return 0;

      // Calculate consecutive days
      const uniqueDates = [...new Set(sortedRecords.map(record => record.date))];
      uniqueDates.sort((a, b) => b.localeCompare(a)); // Sort dates descending
      
      let currentDate = new Date(uniqueDates[0]);
      
      for (const dateStr of uniqueDates) {
        const recordDate = new Date(dateStr);
        const daysDiff = Math.floor((currentDate.getTime() - recordDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  static async getAverageWakeTime(): Promise<string> {
    try {
      const existingData = await AsyncStorage.getItem(WAKE_UP_STATS_KEY);
      if (!existingData) return 'No data yet';

      const records: WakeUpRecord[] = JSON.parse(existingData);
      if (records.length === 0) return 'No data yet';

      // Get records from the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentRecords = records.filter(record => record.timestamp > oneWeekAgo);
      
      if (recentRecords.length === 0) return 'No recent data';

      // Calculate average time in minutes from midnight
      const totalMinutes = recentRecords.reduce((sum, record) => {
        const [hours, minutes] = record.time.split(':').map(Number);
        return sum + (hours * 60 + minutes);
      }, 0);

      const averageMinutes = Math.round(totalMinutes / recentRecords.length);
      const avgHours = Math.floor(averageMinutes / 60);
      const avgMins = averageMinutes % 60;

      // Format as 12-hour time
      const period = avgHours >= 12 ? 'PM' : 'AM';
      const displayHours = avgHours === 0 ? 12 : avgHours > 12 ? avgHours - 12 : avgHours;
      const formattedTime = `${displayHours}:${avgMins.toString().padStart(2, '0')} ${period}`;

      return `${formattedTime} this week`;
    } catch (error) {
      console.error('Error calculating average wake time:', error);
      return 'Error calculating average';
    }
  }

  static async getWakeUpStats(): Promise<{ streak: number; averageWakeTime: string }> {
    const [streak, averageWakeTime] = await Promise.all([
      this.getStreak(),
      this.getAverageWakeTime()
    ]);

    return { streak, averageWakeTime };
  }

  static formatStreak(streak: number): string {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return '1 day in a row';
    return `${streak} days in a row`;
  }
}
