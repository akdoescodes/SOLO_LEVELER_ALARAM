import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, TrendingUp } from 'lucide-react-native';
import { theme, commonStyles } from '@/constants/theme';
import { GradientIcon } from './GradientIcon';
import { GradientText } from './GradientText';

interface AlarmInsightCardProps {
  nextAlarmTime?: string;
  timeRemaining?: string;
  streak?: string;
  averageWakeTime?: string;
}

export function AlarmInsightCard({
  nextAlarmTime = "Tomorrow at 6:30 AM",
  timeRemaining = "In 7h 40m",
  streak = "3 days in a row",
  averageWakeTime = "7:12 AM this week"
}: AlarmInsightCardProps) {

  return (
    <View style={styles.container}>
      <View style={[styles.card, commonStyles.glassCard]}>
        {/* Next Alarm Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GradientIcon icon={Clock} size={18} />
            <Text style={styles.sectionTitle}>Next Alarm</Text>
          </View>
          <View style={styles.nextAlarmContent}>
            <GradientText
              style={styles.nextAlarmTime}
              colors={theme.colors.gradient.primary}
            >
              {nextAlarmTime}
            </GradientText>
            <Text style={styles.timeRemaining}>{timeRemaining}</Text>
          </View>
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
                {streak}
              </GradientText>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statItem}>
              <GradientText
                style={styles.statValue}
                colors={theme.colors.gradient.primary}
              >
                {averageWakeTime}
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
    marginBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  nextAlarmContent: {
    alignItems: 'center',
  },
  nextAlarmTime: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  timeRemaining: {
    fontSize: theme.typography.fontSize.sm,
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
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
