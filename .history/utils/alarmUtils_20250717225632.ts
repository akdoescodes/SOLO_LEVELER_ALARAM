import { Alarm } from '@/types';

interface NextAlarmInfo {
  time: string;
  timeRemaining: string;
  dayName: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    let nearestDayOffset = Infinity;

    for (const alarm of enabledAlarms) {
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const alarmTimeInMinutes = hours * 60 + minutes;

      // Check each day the alarm is set for
      for (const dayStr of alarm.days) {
        const dayIndex = this.getDayIndex(dayStr);
        
        // Calculate how many days from now this alarm will trigger
        let dayOffset = dayIndex - currentDay;
        
        // If it's today but the time has passed, or if it's a past day of the week
        if (dayOffset < 0 || (dayOffset === 0 && alarmTimeInMinutes <= currentTime)) {
          dayOffset += 7; // Next week
        }

        // If this alarm is sooner than our current nearest
        if (dayOffset < nearestDayOffset || 
            (dayOffset === nearestDayOffset && alarmTimeInMinutes < (nearestAlarm ? this.getTimeInMinutes(nearestAlarm.time) : Infinity))) {
          
          nearestAlarm = alarm;
          nearestDayOffset = dayOffset;
          
          // Create the actual date/time for this alarm
          const alarmDate = new Date(now);
          alarmDate.setDate(alarmDate.getDate() + dayOffset);
          alarmDate.setHours(hours, minutes, 0, 0);
          nearestTime = alarmDate;
        }
      }
    }

    if (!nearestAlarm || !nearestTime) {
      return null;
    }

    return {
      time: this.formatAlarmTime(nearestAlarm.time),
      timeRemaining: this.getTimeRemaining(nearestTime),
      dayName: nearestDayOffset === 0 ? 'Today' : 
               nearestDayOffset === 1 ? 'Tomorrow' : 
               DAYS_OF_WEEK[nearestTime.getDay()]
    };
  }

  private static getDayIndex(dayStr: string): number {
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    return dayMap[dayStr] ?? 0;
  }

  private static getTimeInMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
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
      return `In ${hours}h ${minutes}m`;
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
