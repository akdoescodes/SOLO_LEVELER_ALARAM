import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock } from 'lucide-react-native';
import { useStorage } from '@/hooks/useStorage';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { AlarmCard } from '@/components/AlarmCard';
import { AlarmInsightCard } from '@/components/AlarmInsightCard';
import { AddAlarmModal } from '@/components/AddAlarmModal';
import { theme, commonStyles } from '@/constants/theme';

export default function AlarmsScreen() {
  const { alarms, settings, saveAlarms, loaded } = useStorage();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stopAlarm } = useAlarmManager(alarms, settings.soundEnabled, settings.vibrationEnabled);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleAlarm = (alarmId: string) => {
    const updatedAlarms = alarms.map(alarm =>
      alarm.id === alarmId ? { ...alarm, enabled: !alarm.enabled } : alarm
    );
    saveAlarms(updatedAlarms);
  };

  const deleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
            saveAlarms(updatedAlarms);
          },
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Alarms</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Plus size={24} color={theme.colors.text.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {alarms.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={64} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Alarms Set</Text>
              <Text style={styles.emptyStateText}>
                Tap the + button to create your first alarm
              </Text>
            </View>
          ) : (
            <>
              <AlarmInsightCard alarms={alarms} />
              {alarms
                .sort((a, b) => {
                  // Convert time strings to minutes for easy comparison
                  const getMinutes = (timeStr: string) => {
                    const [time, period] = timeStr.split(' ');
                    const [hours, minutes] = time.split(':').map(Number);
                    let totalMinutes = hours * 60 + minutes;
                    
                    // Convert to 24-hour format
                    if (period === 'PM' && hours !== 12) {
                      totalMinutes += 12 * 60;
                    } else if (period === 'AM' && hours === 12) {
                      totalMinutes = minutes; // 12 AM is 00:xx
                    }
                    
                    return totalMinutes;
                  };
                  
                  return getMinutes(a.time) - getMinutes(b.time);
                })
                .map(alarm => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={() => toggleAlarm(alarm.id)}
                    onDelete={() => deleteAlarm(alarm.id)}
                  />
                ))}
            </>
          )}
        </ScrollView>

        <AddAlarmModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(newAlarm) => {
            saveAlarms([...alarms, newAlarm]);
            setShowAddModal(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    ...theme.shadows.md,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});