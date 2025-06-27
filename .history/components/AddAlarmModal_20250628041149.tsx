import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Music, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alarm } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AddAlarmModal({ visible, onClose, onSave }: AddAlarmModalProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [soundUri, setSoundUri] = useState<string | undefined>();
  const [soundName, setSoundName] = useState<string | undefined>();

  const resetForm = () => {
    setName('');
    setTime('07:00');
    setSelectedDays([]);
    setSoundUri(undefined);
    setSoundName(undefined);
  };

  const pickAudioFile = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Custom sound upload is not available on web. Default alarm sound will be used.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Create a permanent directory for alarm sounds
        const soundsDir = `${FileSystem.documentDirectory}alarm-sounds/`;
        await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
        
        // Copy file to permanent location
        const fileName = `alarm_${Date.now()}.${asset.name.split('.').pop()}`;
        const permanentUri = `${soundsDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: permanentUri,
        });

        setSoundUri(permanentUri);
        setSoundName(asset.name);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select audio file');
      console.log('Error picking audio file:', error);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an alarm name');
      return;
    }

    const newAlarm: Alarm = {
      id: Date.now().toString(),
      name: name.trim(),
      time,
      enabled: true,
      days: selectedDays,
      soundUri,
      soundName,
      createdAt: Date.now(),
    };

    onSave(newAlarm);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={[theme.colors.surface.secondary, theme.colors.background]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>New Alarm</Text>
            <TouchableOpacity onPress={handleSave}>
              <LinearGradient 
                colors={theme.colors.gradient.primary} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButton}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alarm Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter alarm name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time</Text>
              <View style={styles.timeContainer}>
                <Clock size={24} color={theme.colors.text.accent} />
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Sound</Text>
              <TouchableOpacity style={styles.soundContainer} onPress={pickAudioFile}>
                <Music size={24} color={theme.colors.text.accent} />
                <View style={styles.soundInfo}>
                  <Text style={styles.soundText}>
                    {soundName || 'Default alarm sound'}
                  </Text>
                  <Text style={styles.soundSubtext}>
                    {soundName ? 'Tap to change' : 'Tap to upload custom sound'}
                  </Text>
                </View>
                <Upload size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Repeat</Text>
              <View style={styles.daysContainer}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                  >
                    {selectedDays.includes(day) ? (
                      <LinearGradient 
                        colors={theme.colors.gradient.primary} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        style={styles.dayButton}
                      >
                        <Text style={styles.dayButtonTextSelected}>
                          {day.substring(0, 3)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.dayButtonInactive}>
                        <Text style={styles.dayButtonText}>
                          {day.substring(0, 3)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.daysHint}>
                Leave empty for one-time alarm
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  saveButtonGradient: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  saveButton: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  timeContainer: {
    ...commonStyles.glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  soundContainer: {
    ...commonStyles.glassCard,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  soundInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  soundText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  soundSubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    minWidth: 44,
    alignItems: 'center',
  },
  dayButtonInactive: {
    ...commonStyles.filterButtonInactive,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 44,
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
  dayButtonTextSelected: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  daysHint: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
});