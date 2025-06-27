import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock } from 'lucide-react-native';
import { useStorage } from '@/hooks/useStorage';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { AlarmCard } from '@/components/AlarmCard';
import { AddAlarmModal } from '@/components/AddAlarmModal';

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
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Alarms</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {alarms.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={64} color="#6B7280" />
              <Text style={styles.emptyStateTitle}>No Alarms Set</Text>
              <Text style={styles.emptyStateText}>
                Tap the + button to create your first alarm
              </Text>
            </View>
          ) : (
            alarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={() => toggleAlarm(alarm.id)}
                onDelete={() => deleteAlarm(alarm.id)}
              />
            ))
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
    </LinearGradient>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});