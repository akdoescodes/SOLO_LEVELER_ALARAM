import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Music, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alarm } from '@/types';

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
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>New Alarm</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
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
                <Clock size={24} color="#8B5CF6" />
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Sound</Text>
              <TouchableOpacity style={styles.soundContainer} onPress={pickAudioFile}>
                <Music size={24} color="#8B5CF6" />
                <View style={styles.soundInfo}>
                  <Text style={styles.soundText}>
                    {soundName || 'Default alarm sound'}
                  </Text>
                  <Text style={styles.soundSubtext}>
                    {soundName ? 'Tap to change' : 'Tap to upload custom sound'}
                  </Text>
                </View>
                <Upload size={20} color="#9CA3AF" />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  timeInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  soundInfo: {
    flex: 1,
    marginLeft: 12,
  },
  soundText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  soundSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  dayButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  dayButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  daysHint: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
});