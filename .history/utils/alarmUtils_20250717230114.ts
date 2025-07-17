import { Alarm } from '@/types';

interface NextAlarmInfo {
  time: string;
  timeRemaining: string;
  dayName: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class AlarmUtils {
  static getNextAlarm(alarms: Alarm[]): NextAlarmInfo | null {
    // Filter enabled alarms
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);
    
    if (enabledAlarms.length === 0) {
      return null;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    let nearestAlarm: Alarm | null = null;
    let nearestTime: Date | null = null;
    let nearestMinutesFromNow = Infinity;

    for (const alarm of enabledAlarms) {
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const alarmTimeInMinutes = hours * 60 + minutes;

      // Handle one-time alarms (no days selected)
      if (alarm.days.length === 0) {
        // One-time alarm - check if it's later today or tomorrow
        const todayAlarmTime = new Date(now);
        todayAlarmTime.setHours(hours, minutes, 0, 0);

        let targetTime: Date;
        if (alarmTimeInMinutes > currentTime) {
          // Later today
          targetTime = todayAlarmTime;
        } else {
          // Tomorrow
          targetTime = new Date(todayAlarmTime);
          targetTime.setDate(targetTime.getDate() + 1);
        }

        const minutesFromNow = Math.floor((targetTime.getTime() - now.getTime()) / (1000 * 60));
        
        if (minutesFromNow < nearestMinutesFromNow) {
          nearestAlarm = alarm;
          nearestTime = targetTime;
          nearestMinutesFromNow = minutesFromNow;
        }
      } else {
        // Recurring alarm - check each selected day
        for (const dayName of alarm.days) {
          const dayIndex = this.getDayIndex(dayName);
          
          // Calculate how many days from now this alarm will trigger
          let dayOffset = dayIndex - currentDay;
          
          // If it's today but the time has passed, or if it's a past day of the week
          if (dayOffset < 0 || (dayOffset === 0 && alarmTimeInMinutes <= currentTime)) {
            dayOffset += 7; // Next week
          }

          // Create the actual date/time for this alarm
          const alarmDate = new Date(now);
          alarmDate.setDate(alarmDate.getDate() + dayOffset);
          alarmDate.setHours(hours, minutes, 0, 0);
          
          const minutesFromNow = Math.floor((alarmDate.getTime() - now.getTime()) / (1000 * 60));

          if (minutesFromNow < nearestMinutesFromNow) {
            nearestAlarm = alarm;
            nearestTime = alarmDate;
            nearestMinutesFromNow = minutesFromNow;
          }
        }
      }
    }

    if (!nearestAlarm || !nearestTime) {
      return null;
    }

    // Calculate day name
    const dayOffset = Math.floor((nearestTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let dayName: string;
    
    if (dayOffset === 0) {
      dayName = 'Today';
    } else if (dayOffset === 1) {
      dayName = 'Tomorrow';
    } else {
      dayName = DAYS_OF_WEEK[nearestTime.getDay()];
    }

    return {
      time: this.formatAlarmTime(nearestAlarm.time),
      timeRemaining: this.getTimeRemaining(nearestTime),
      dayName
    };
  }

  private static getDayIndex(dayName: string): number {
    // Handle full day names (Monday, Tuesday, etc.)
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return dayMap[dayName] ?? 0;
  }

  private static formatAlarmTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private static getTimeRemaining(targetTime: Date): string {
    const now = new Date();
    const diffMs = targetTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Now';
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `In ${minutes}m`;
    } else if (hours < 24) {
      return minutes > 0 ? `In ${hours}h ${minutes}m` : `In ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `In ${days}d`;
      } else {
        return `In ${days}d ${remainingHours}h`;
      }
    }
  }
}
