import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Clock, Music, Upload, Folder, Quote } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alarm } from '@/types';
import { useStorage } from '@/hooks/useStorage';
import { theme, commonStyles } from '@/constants/theme';

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddAlarmModal({ visible, onClose, onSave }: AddAlarmModalProps) {
  const { quoteFolders, quotes } = useStorage();
  
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState(''); // Changed from 'name' to 'label'
  const [time, setTime] = useState({ hours: 7, minutes: 0, seconds: 0 });
  const [selectedSound, setSelectedSound] = useState('default');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [soundUri, setSoundUri] = useState<string | undefined>(undefined);
  const [soundName, setSoundName] = useState<string | undefined>(undefined);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Quote folder selection
  const [selectedQuoteFolderId, setSelectedQuoteFolderId] = useState<string>('');
  const [swipeRequirement, setSwipeRequirement] = useState<number>(4);
  const [quoteOrderMode, setQuoteOrderMode] = useState<'random' | 'sequential' | 'newest' | 'oldest'>('random');
  const [folderSearchQuery, setFolderSearchQuery] = useState<string>('');
  
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

  // Calculate available quotes in selected folder
  const getAvailableQuotesCount = () => {
    if (!selectedQuoteFolderId) {
      return quotes.length; // If no folder selected, use all quotes
    }
    return quotes.filter(quote => quote.folderId === selectedQuoteFolderId).length;
  };

  // Get default folder (first folder with quotes or first folder)
  const getDefaultFolder = () => {
    const folderWithQuotes = quoteFolders.find(folder => 
      quotes.filter(q => q.folderId === folder.id).length > 0
    );
    return folderWithQuotes || quoteFolders[0];
  };

  // Get effective folder and quote count (falls back to default if current has 0 quotes)
  const getEffectiveFolderInfo = () => {
    const currentQuotes = getAvailableQuotesCount();
    if (selectedQuoteFolderId && currentQuotes === 0) {
      // Current folder has no quotes, fall back to default
      const defaultFolder = getDefaultFolder();
      if (defaultFolder) {
        const defaultQuotes = quotes.filter(q => q.folderId === defaultFolder.id).length;
        return {
          folderId: defaultFolder.id,
          folderName: defaultFolder.name,
          quotesCount: defaultQuotes,
          isUsingDefault: true
        };
      }
    }
    
    return {
      folderId: selectedQuoteFolderId,
      folderName: selectedQuoteFolderId ? quoteFolders.find(f => f.id === selectedQuoteFolderId)?.name : 'All Folders',
      quotesCount: currentQuotes,
      isUsingDefault: false
    };
  };

  // Get slider range
  const getSliderRange = () => {
    const effectiveInfo = getEffectiveFolderInfo();
    return {
      min: 1,
      max: Math.max(effectiveInfo.quotesCount, 1),
      effectiveInfo
    };
  };

  // Adjust swipe requirement when folder changes
  useEffect(() => {
    const { effectiveInfo } = getSliderRange();
    
    if (effectiveInfo.quotesCount > 0) {
      // If current requirement exceeds available, reduce it
      if (swipeRequirement > effectiveInfo.quotesCount) {
        setSwipeRequirement(effectiveInfo.quotesCount);
      }
      // If using default folder due to empty selection, set to 4 swipes
      else if (effectiveInfo.isUsingDefault) {
        setSwipeRequirement(Math.min(4, effectiveInfo.quotesCount));
      }
      // If no requirement is set (like on first load), set a sensible default
      else if (swipeRequirement === 1 && selectedQuoteFolderId === '') {
        setSwipeRequirement(Math.min(effectiveInfo.quotesCount, 4));
      }
    } else {
      // No quotes available anywhere, set to 1
      setSwipeRequirement(1);
    }
  }, [selectedQuoteFolderId, quotes]);

  // Filter folders based on search query
  const filteredFolders = quoteFolders.filter(folder =>
    folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
  );

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
    setLabel('');
    setTime({ hours: 7, minutes: 0, seconds: 0 });
    setSelectedDays([]);
    setSoundUri(undefined);
    setSoundName(undefined);
    setSelectedQuoteFolderId('');
    setSwipeRequirement(4); // Default to 4 swipes
    setQuoteOrderMode('random');
    setFolderSearchQuery('');
    setScheduleStartDate(new Date());
    setScheduleEndDate(new Date());
    setShowScheduleSection(false);
    setHasStartDate(false);
    setHasEndDate(false);
  };  const pickAudioFile = async () => {
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
    // Label is now optional, no need to check if it's empty
    
    const timeString = `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
    
    onSave({
      id: Date.now().toString(),
      name: label.trim() || 'Alarm', // Use label or default to 'Alarm' if empty
      time: timeString,
      enabled: true,
      days: selectedDays,
      soundUri,
      soundName,
      createdAt: Date.now(),
      startDate: hasStartDate ? scheduleStartDate.toISOString() : undefined,
      endDate: hasEndDate ? scheduleEndDate.toISOString() : undefined, // undefined means permanent
      quoteFolderId: selectedQuoteFolderId || undefined,
      swipeRequirement: swipeRequirement,
      quoteOrderMode: quoteOrderMode,
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

            {/* 6. Quote Folder Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quote Folder</Text>
              <Text style={styles.sectionDescription}>Choose which folder's quotes to display when alarm goes off</Text>
              
              {quoteFolders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Folder size={24} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyText}>No quote folders available</Text>
                  <Text style={styles.emptySubtext}>Create quote folders in the Quotes tab first</Text>
                </View>
              ) : (
                <>
                  {/* Search Input */}
                  <TextInput
                    style={styles.searchInput}
                    value={folderSearchQuery}
                    onChangeText={setFolderSearchQuery}
                    placeholder="Search folders..."
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                  
                  <View style={styles.folderScrollFrame}>
                    <ScrollView 
                      style={styles.folderScrollView}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <View style={styles.folderContainer}>
                        {/* Always show "All Quotes" option first */}
                        <TouchableOpacity
                          style={[
                            styles.folderOption,
                            !selectedQuoteFolderId && styles.folderOptionSelected
                          ]}
                          onPress={() => setSelectedQuoteFolderId('')}
                        >
                          <Quote size={20} color={theme.colors.text.accent} />
                          <View style={styles.folderInfo}>
                            <Text style={styles.folderName}>All Quotes</Text>
                            <Text style={styles.folderSubtext}>{quotes.length} quotes available</Text>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Show filtered folders */}
                        {filteredFolders.length === 0 && folderSearchQuery ? (
                          <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No folders found matching "{folderSearchQuery}"</Text>
                          </View>
                        ) : (
                          filteredFolders.map((folder) => {
                            const folderQuotes = quotes.filter(q => q.folderId === folder.id);
                            return (
                              <TouchableOpacity
                                key={folder.id}
                                style={[
                                  styles.folderOption,
                                  selectedQuoteFolderId === folder.id && styles.folderOptionSelected
                                ]}
                                onPress={() => setSelectedQuoteFolderId(folder.id)}
                              >
                                <View style={[styles.folderIcon, { backgroundColor: folder.color }]} />
                                <View style={styles.folderInfo}>
                                  <Text style={styles.folderName}>{folder.name}</Text>
                                  <Text style={styles.folderSubtext}>{folderQuotes.length} quotes</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            {/* 7. Swipe Requirement Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quotes to Swipe</Text>
              <Text style={styles.sectionDescription}>
                Choose how many quotes to swipe through before stopping the alarm
              </Text>
              
              {(() => {
                const { min, max, effectiveInfo } = getSliderRange();
                
                return (
                  <View style={styles.sliderContainer}>
                    {/* Plus/Minus Controls */}
                    <View style={styles.sliderControls}>
                      <TouchableOpacity
                        style={[styles.sliderButton, swipeRequirement <= min && styles.sliderButtonDisabled]}
                        onPress={() => setSwipeRequirement(Math.max(min, swipeRequirement - 1))}
                        disabled={swipeRequirement <= min}
                      >
                        <Text style={[styles.sliderButtonText, swipeRequirement <= min && styles.sliderButtonTextDisabled]}>−</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.sliderCurrentValue}>{swipeRequirement}</Text>
                      
                      <TouchableOpacity
                        style={[styles.sliderButton, swipeRequirement >= max && styles.sliderButtonDisabled]}
                        onPress={() => setSwipeRequirement(Math.min(max, swipeRequirement + 1))}
                        disabled={swipeRequirement >= max}
                      >
                        <Text style={[styles.sliderButtonText, swipeRequirement >= max && styles.sliderButtonTextDisabled]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Folder Info */}
                    <View style={styles.folderInfoContainer}>
                      {effectiveInfo.isUsingDefault ? (
                        <Text style={styles.warningText}>
                          ⚠️ Selected folder is empty. Using "{effectiveInfo.folderName}" folder ({effectiveInfo.quotesCount} quotes)
                        </Text>
                      ) : (
                        <Text style={styles.folderInfoText}>
                          {effectiveInfo.folderId 
                            ? `📁 ${effectiveInfo.folderName} • ${effectiveInfo.quotesCount} quotes available`
                            : `📚 All folders • ${effectiveInfo.quotesCount} total quotes available`
                          }
                        </Text>
                      )}
                    </View>
                    
                    {effectiveInfo.quotesCount === 0 && (
                      <Text style={styles.warningText}>
                        ⚠️ No quotes available. Please add quotes to a folder first.
                      </Text>
                    )}
                  </View>
                );
              })()}
            </View>

            {/* 8. Quote Order Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quote Order</Text>
              <Text style={styles.sectionDescription}>How to arrange quotes during the alarm</Text>
              
              <View style={styles.orderContainer}>
                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    quoteOrderMode === 'random' && styles.orderOptionSelected
                  ]}
                  onPress={() => setQuoteOrderMode('random')}
                >
                  <Text style={[
                    styles.orderText,
                    quoteOrderMode === 'random' && styles.orderTextSelected
                  ]}>Random</Text>
                  <Text style={styles.orderSubtext}>Shuffled order</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    quoteOrderMode === 'sequential' && styles.orderOptionSelected
                  ]}
                  onPress={() => setQuoteOrderMode('sequential')}
                >
                  <Text style={[
                    styles.orderText,
                    quoteOrderMode === 'sequential' && styles.orderTextSelected
                  ]}>Sequential</Text>
                  <Text style={styles.orderSubtext}>In order added</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    quoteOrderMode === 'newest' && styles.orderOptionSelected
                  ]}
                  onPress={() => setQuoteOrderMode('newest')}
                >
                  <Text style={[
                    styles.orderText,
                    quoteOrderMode === 'newest' && styles.orderTextSelected
                  ]}>Newest</Text>
                  <Text style={styles.orderSubtext}>Recently added first</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.orderOption,
                    quoteOrderMode === 'oldest' && styles.orderOptionSelected
                  ]}
                  onPress={() => setQuoteOrderMode('oldest')}
                >
                  <Text style={[
                    styles.orderText,
                    quoteOrderMode === 'oldest' && styles.orderTextSelected
                  ]}>Oldest</Text>
                  <Text style={styles.orderSubtext}>Oldest first</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* End spacing for visual breathing room */}
            <View style={styles.endSpacing} />
          </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl, // Add bottom padding for scroll
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
  // Date picker styles
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dateInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  dateTextEmpty: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  clearDateButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  clearDateText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.accent,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  scheduleToggle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
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
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#FFB800',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  folderContainer: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  folderScrollFrame: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
    maxHeight: 500, // 2.5x the original height (200px * 2.5)
  },
  folderScrollView: {
    flexGrow: 0, // Prevent it from expanding
  },
  searchInput: {
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  noResultsContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  folderOptionSelected: {
    borderColor: theme.colors.text.accent,
    borderWidth: 2,
  },
  folderIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.md,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  folderSubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  swipeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  swipeOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swipeOptionSelected: {
    borderColor: theme.colors.text.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  swipeText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.secondary,
  },
  swipeTextSelected: {
    color: theme.colors.text.accent,
  },
  orderContainer: {
    gap: theme.spacing.sm,
  },
  orderOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderOptionSelected: {
    borderColor: theme.colors.text.accent,
    borderWidth: 2,
  },
  orderText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  orderTextSelected: {
    color: theme.colors.text.accent,
  },
  orderSubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  // Slider Styles
  sliderContainer: {
    marginTop: theme.spacing.md,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sliderButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderButtonText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  sliderButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  sliderCurrentValue: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.accent,
    minWidth: 40,
    textAlign: 'center',
  },
  folderInfoContainer: {
    marginTop: theme.spacing.md,
  },
  folderInfoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});