import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Music, Upload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alarm, AlarmState } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddAlarmModal({ visible, onClose, onSave }: AddAlarmModalProps) {
  // Add debugging
  console.log('AddAlarmModal render - visible:', visible);
  
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState(''); // Changed from 'name' to 'label'
  const [time, setTime] = useState({ hours: 7, minutes: 0, seconds: 0 });
  const [selectedSound, setSelectedSound] = useState('default');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [soundUri, setSoundUri] = useState<string | undefined>(undefined);
  const [soundName, setSoundName] = useState<string | undefined>(undefined);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Schedule date range
  const [scheduleStartDate, setScheduleStartDate] = useState<Date>(new Date());
  const [scheduleEndDate, setScheduleEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showScheduleSection, setShowScheduleSection] = useState(false);
  const [hasStartDate, setHasStartDate] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false); // Track if user has explicitly set end date

  // Scroll enhancement states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Handle scroll events for progress and end detection
  const handleScrollModal = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    
    // Calculate scroll progress (0 to 1)
    const maxScroll = contentHeight - screenHeight;
    const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0;
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
    
    // Check if near bottom (within 30px)
    const isNearBottom = scrollPosition + screenHeight >= contentHeight - 30;
    setIsAtBottom(isNearBottom);
  };

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
    setTitle(''); // Reset title as well
    setLabel('');
    setTime({ hours: 7, minutes: 0, seconds: 0 });
    setSelectedDays([]);
    setSoundUri(undefined);
    setSoundName(undefined);
    setScheduleStartDate(new Date());
    setScheduleEndDate(new Date());
    setShowScheduleSection(false);
    setHasStartDate(false);
    setHasEndDate(false);
    setShowTimePicker(false); // Reset time picker state
    setShowStartDatePicker(false); // Reset date picker states
    setShowEndDatePicker(false);
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
    console.log('Saving new alarm...');
    
    const timeString = `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
    
    const newAlarm: Alarm = {
      id: Date.now().toString(),
      name: label.trim() || 'Alarm', // Use label or default to 'Alarm' if empty
      time: timeString,
      enabled: true,
      days: selectedDays,
      soundUri,
      soundName,
      createdAt: Date.now(),
      startDate: hasStartDate ? scheduleStartDate.toISOString() : undefined,
      endDate: hasEndDate ? scheduleEndDate.toISOString() : null, // Use null for permanent instead of undefined
      state: 'idle', // Initialize with idle state
    };
    
    console.log('New alarm object:', newAlarm);
    
    onSave(newAlarm);
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
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>New Alarm</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={true}
            onScroll={handleScrollModal}
            scrollEventThrottle={16}
            bounces={true}
            indicatorStyle="white"
          >
            {/* 1. Time Section */}
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

            {/* 2. Repeat Section */}
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
                Select the days you want this alarm to repeat
              </Text>
            </View>

            {/* 3. Schedule Section (Collapsible) */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.scheduleHeader}
                onPress={() => setShowScheduleSection(!showScheduleSection)}
              >
                <Text style={styles.sectionTitle}>Schedule</Text>
                <Text style={styles.scheduleToggle}>
                  {showScheduleSection ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              
              {showScheduleSection && (
                <View style={styles.scheduleContent}>
                  {/* Start Date Button */}
                  <TouchableOpacity
                    style={styles.dateContainer}
                    onPress={() => {
                      setShowStartDatePicker(true);
                      setHasStartDate(true);
                    }}
                  >
                    <Clock size={20} color={theme.colors.text.accent} />
                    <View style={styles.dateInfo}>
                      <Text style={styles.dateLabel}>Start Date</Text>
                      <Text style={styles.dateText}>
                        {hasStartDate ? scheduleStartDate.toLocaleDateString() : 'Tap to set start date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* End Date Button - Always show when schedule section is open */}
                  <TouchableOpacity
                    style={styles.dateContainer}
                    onPress={() => {
                      setShowEndDatePicker(true);
                      setHasEndDate(true);
                    }}
                  >
                    <Clock size={20} color={theme.colors.text.secondary} />
                    <View style={styles.dateInfo}>
                      <Text style={styles.dateLabel}>End Date</Text>
                      <Text style={[styles.dateText, !hasEndDate && styles.dateTextEmpty]}>
                        {hasEndDate ? scheduleEndDate.toLocaleDateString() : 'Never (Tap to set end date)'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Date Pickers */}
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={scheduleStartDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowStartDatePicker(false);
                        if (selectedDate) {
                          setScheduleStartDate(selectedDate);
                          // Don't automatically set end date - leave it as permanent unless explicitly set
                        }
                      }}
                    />
                  )}
                  
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={scheduleEndDate}
                      mode="date"
                      display="default"
                      minimumDate={scheduleStartDate}
                      onChange={(event, selectedDate) => {
                        setShowEndDatePicker(false);
                        if (selectedDate) {
                          setScheduleEndDate(selectedDate);
                          setHasEndDate(true);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            </View>

            {/* 4. Label Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Label (Optional)</Text>
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Enter alarm label (optional)"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            {/* 5. Sound Section */}
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
            
            {/* End spacing for visual breathing room */}
            <View style={styles.endSpacing} />
          </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#010101', // Explicit dark background
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#010101',
  },
  container: {
    flex: 1,
    backgroundColor: '#010101', // Override theme background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#010101',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF', // Explicit white
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA', // Explicit blue
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Explicit white
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF', // Explicit white
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  timeDisplay: {
    flex: 1,
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF', // Explicit white
  },
  timeHint: {
    fontSize: 14,
    color: '#9CA3AF', // Explicit gray
  },
  timePicker: {
    marginTop: 16,
  },
  doneButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#60A5FA',
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  soundInfo: {
    flex: 1,
    marginLeft: 16,
  },
  soundText: {
    fontSize: 16,
    color: '#FFFFFF', // Explicit white
  },
  soundSubtext: {
    fontSize: 14,
    color: '#9CA3AF', // Explicit gray
    marginTop: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayButtonSelected: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  daysHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Date picker styles
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dateInfo: {
    flex: 1,
    marginLeft: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dateTextEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  clearDateButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  clearDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleToggle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#60A5FA',
  },
  scheduleContent: {
    marginTop: 16,
  },
  endSpacing: {
    height: 32,
  },
});
    color: theme.colors.text.accent,
    fontWeight: 'bold',
  },
  scheduleContent: {
    marginTop: theme.spacing.md,
  },
  endSpacing: {
    height: theme.spacing.xl, // Extra spacing at the end for visual breathing room
    marginTop: theme.spacing.md,
  },
  // New simplified test styles
  testContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  timeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  timeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  simpleInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    fontSize: 16,
  },
});