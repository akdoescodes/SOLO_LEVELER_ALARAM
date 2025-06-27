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
      <LinearGradient
        colors={alarm.enabled ? ['#8B5CF6', '#7C3AED'] : ['#374151', '#4B5563']}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Text style={styles.time}>{alarm.time}</Text>
            <Text style={styles.name}>{alarm.name}</Text>
            <View style={styles.infoRow}>
              <View style={styles.daysContainer}>
                <Calendar size={14} color="#D1D5DB" />
                <Text style={styles.days}>{getDaysText()}</Text>
              </View>
              {alarm.soundName && (
                <View style={styles.soundContainer}>
                  <Music size={14} color="#D1D5DB" />
                  <Text style={styles.soundText}>{alarm.soundName}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.rightContent}>
            <Switch
              value={alarm.enabled}
              onValueChange={onToggle}
              trackColor={{ false: '#6B7280', true: '#FFFFFF' }}
              thumbColor={alarm.enabled ? '#8B5CF6' : '#D1D5DB'}
            />
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
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