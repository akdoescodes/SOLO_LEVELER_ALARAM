import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, TrendingUp } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme, commonStyles } from '@/constants/theme';
import { GradientIcon } from './GradientIcon';
import { GradientText } from './GradientText';
import { WakeUpStatsManager } from '@/utils/wakeUpStats';
import { AlarmUtils } from '@/utils/alarmUtils';
import { Alarm } from '@/types';

interface AlarmInsightCardProps {
  alarms: Alarm[];
}

export function AlarmInsightCard({
  alarms
}: AlarmInsightCardProps) {
  const [wakeUpStats, setWakeUpStats] = useState({
    streak: 0,
    avgWakeTime: 'No data',
  });

  const [nextAlarmInfo, setNextAlarmInfo] = useState<{
    time: string;
    timeRemaining: string;
    dayName: string;
  } | null>(null);

  const loadStats = async () => {
    const streak = await WakeUpStatsManager.getStreak();
    const avgTime = await WakeUpStatsManager.getAverageWakeTime();
    
    setWakeUpStats({
      streak,
      avgWakeTime: avgTime,
    });
  };

  const updateNextAlarm = () => {
    const nextAlarm = AlarmUtils.getNextAlarm(alarms);
    setNextAlarmInfo(nextAlarm);
  };

  useEffect(() => {
    loadStats();
    updateNextAlarm();

    // Update time remaining every minute
    const interval = setInterval(updateNextAlarm, 60000);
    
    return () => clearInterval(interval);
  }, [alarms]);

  // Refresh stats when screen comes into focus (e.g., after dismissing an alarm)
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      updateNextAlarm();
    }, [alarms])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.card, commonStyles.glassCard]}>
        {/* Next Alarm Section */}
        <View style={styles.section}>
          <View style={styles.nextAlarmRow}>
            <View style={styles.sectionHeader}>
              <GradientIcon icon={Clock} size={16} />
              <Text style={styles.sectionTitle}>Next Alarm</Text>
            </View>
            <View style={styles.nextAlarmContent}>
              <GradientText
                style={styles.nextAlarmTime}
                colors={theme.colors.gradient.primary}
              >
                {nextAlarmInfo 
                  ? `${nextAlarmInfo.dayName} at ${nextAlarmInfo.time}`
                  : "No alarms set"
                }
              </GradientText>
            </View>
          </View>
          <Text style={styles.timeRemaining}>
            {nextAlarmInfo?.timeRemaining || ""}
          </Text>
        </View>

        {/* Wake-Up Stats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GradientIcon icon={TrendingUp} size={18} />
            <Text style={styles.sectionTitle}>Wake-Up Stats</Text>
          </View>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <GradientText
                style={styles.statValue}
                colors={theme.colors.gradient.primary}
              >
                {wakeUpStats.streak > 0 ? `${wakeUpStats.streak} days` : 'No streak'}
              </GradientText>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <GradientText
                style={styles.statValue}
                colors={theme.colors.gradient.primary}
              >
                {wakeUpStats.avgWakeTime}
              </GradientText>
              <Text style={styles.statLabel}>Average</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  nextAlarmContent: {
    alignItems: 'center',
  },
  nextAlarmTime: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  timeRemaining: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
