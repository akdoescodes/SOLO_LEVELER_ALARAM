import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Music, Upload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

export default function AddAlarmModal({ visible, onClose, onSave }: AddAlarmModalProps) {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [time, setTime] = useState({ hours: 7, minutes: 0, seconds: 0 });
  const [selectedSound, setSelectedSound] = useState('default');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [soundUri, setSoundUri] = useState<string | undefined>(undefined);
  const [soundName, setSoundName] = useState<string | undefined>(undefined);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Create Date object for the time picker
  const getDateFromTime = () => {
    const date = new Date();
    date.setHours(time.hours);
    date.setMinutes(time.minutes);
    date.setSeconds(0);
    return date;
  };

  // Handle time change from DateTimePicker
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    
    if (selectedDate) {
      const newTime = {
        hours: selectedDate.getHours(),
        minutes: selectedDate.getMinutes(),
        seconds: 0
      };
      setTime(newTime);
    }
  };

  // Format time for display
  const formatTime = (timeObj: { hours: number; minutes: number }) => {
    return `${timeObj.hours.toString().padStart(2, '0')}:${timeObj.minutes.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setName('');
    setTime({ hours: 7, minutes: 0, seconds: 0 });
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

    const timeString = `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
    
    onSave({
      id: Date.now().toString(),
      name: name.trim(),
      time: timeString,
      enabled: true,
      days: selectedDays,
      soundUri,
      soundName,
      createdAt: Date.now(),
    });
    
    resetForm();
    onClose();
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>New Alarm</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time</Text>
              
              {/* Time Display and Picker Button */}
              <TouchableOpacity 
                style={styles.timeContainer} 
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={24} color={theme.colors.text.accent} />
                <Text style={styles.timeDisplay}>
                  {formatTime(time)}
                </Text>
                <Text style={styles.timeHint}>Tap to change</Text>
              </TouchableOpacity>

              {/* DateTime Picker */}
              {showTimePicker && (
                <DateTimePicker
                  value={getDateFromTime()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alarm Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter alarm name"
                placeholderTextColor={theme.colors.text.secondary}
              />
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
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day) && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      selectedDays.includes(day) && styles.dayButtonTextSelected
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.daysHint}>
                Leave empty for one-time alarm
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
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
  saveButton: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.accent,
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
    marginBottom: theme.spacing.md,
  },
  input: {
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
  },
  timeDisplay: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  timeHint: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
  },
  timePicker: {
    marginTop: theme.spacing.md,
  },
  doneButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.text.accent,
    borderRadius: theme.borderRadius.md,
  },
  doneButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
  },
  soundInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
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
    ...commonStyles.filterButtonInactive,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  dayButtonSelected: {
    ...commonStyles.filterButtonActive,
    backgroundColor: theme.colors.text.accent,
  },
  dayButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
  dayButtonTextSelected: {
    color: theme.colors.text.primary,
  },
  daysHint: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
});