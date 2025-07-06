import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Calendar, Music } from 'lucide-react-native';
import { Alarm } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: () => void;
  onDelete: () => void;
}

export function AlarmCard({ alarm, onToggle, onDelete }: AlarmCardProps) {
  const getDaysText = () => {
    if (alarm.days.length === 0) return 'One time';
    if (alarm.days.length === 7) return 'Every day';
    return alarm.days.join(', ');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, commonStyles.glassCard]}>
        {alarm.enabled && (
          <LinearGradient
            colors={theme.colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          />
        )}
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Text style={[styles.time, { color: alarm.enabled ? theme.colors.text.primary : 'rgba(255, 255, 255, 0.5)' }]}>
              {alarm.time}
            </Text>
            <View style={styles.infoRow}>
              <View style={styles.daysContainer}>
                <Calendar size={14} color={theme.colors.text.secondary} />
                <Text style={styles.days}>{getDaysText()}</Text>
              </View>
              {alarm.soundName && (
                <View style={styles.soundContainer}>
                  <Music size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.soundText}>{alarm.soundName}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.rightContent}>
            <View style={styles.switchContainer}>
              <View style={[styles.switchTrack, { backgroundColor: alarm.enabled ? 'transparent' : 'rgba(255, 255, 255, 0.3)' }]}>
                {alarm.enabled && (
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.switchGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                <Switch
                  value={alarm.enabled}
                  onValueChange={onToggle}
                  trackColor={{ false: 'transparent', true: 'transparent' }}
                  thumbColor="white"
                  style={styles.switch}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
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
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  leftContent: {
    flex: 1,
  },
  time: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
  },
  infoRow: {
    marginTop: theme.spacing.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  days: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  rightContent: {
    alignItems: 'center',
  },
  switchContainer: {
    marginBottom: theme.spacing.sm,
  },
  switchTrack: {
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  switchGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  switch: {
    transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }],
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
});