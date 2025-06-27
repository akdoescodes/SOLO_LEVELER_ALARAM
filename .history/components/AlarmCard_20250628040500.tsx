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
            <Text style={styles.time}>{alarm.time}</Text>
            <Text style={styles.name}>{alarm.name}</Text>
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
            <Switch
              value={alarm.enabled}
              onValueChange={onToggle}
              trackColor={{ 
                false: theme.colors.border.primary, 
                true: theme.colors.gradient.primary[0] 
              }}
              thumbColor={alarm.enabled ? theme.colors.text.primary : theme.colors.text.secondary}
            />
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
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  time: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  infoRow: {
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  days: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginLeft: 6,
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginLeft: 6,
  },
  rightContent: {
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 12,
    padding: 8,
  },
});