import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStorage } from '@/hooks/useStorage';
import { alarmService } from '@/services/AlarmService';
import { AlarmCard } from '@/components/AlarmCard';
import { AlarmInsightCard } from '@/components/AlarmInsightCard';
import AddAlarmModal from '@/components/AddAlarmModal';
import { theme, commonStyles } from '@/constants/theme';

export default function AlarmsScreen() {
  const { alarms, settings, saveAlarms, loaded } = useStorage();
  
  // ScrollView ref for resetting scroll position
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 🚀 PROFESSIONAL: Use alarm service directly (no hook recreation)
  const stopAlarm = async (alarmId: string) => {
    await alarmService.stopAlarm(alarmId);
  };
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Scroll enhancement states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showEndIndicator, setShowEndIndicator] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Track if user has scrolled

  // Handle scroll events for progress and end detection
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    
    // Calculate scroll progress (0 to 1)
    const maxScroll = contentHeight - screenHeight;
    const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0;
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
    
    // Check if near bottom (within 50px)
    const isNearBottom = scrollPosition + screenHeight >= contentHeight - 50;
    setIsAtBottom(isNearBottom);
    
    // Show end indicator when scrolled past 80% and there's content to scroll
    setShowEndIndicator(progress > 0.8 && maxScroll > 100);
    
    // Track if user has scrolled (even a little)
    setIsScrolled(scrollPosition > 0);
  };

  // Set status bar for alarms page
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    
    // Only set background color on Android - using red for testing
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.statusBarBackground, true);
    }
  }, []);

  // Update status bar color based on scroll state
  useEffect(() => {
    if (Platform.OS === 'android') {
      const statusBarColor = isScrolled ? theme.colors.statusBarBackground : theme.colors.background;
      StatusBar.setBackgroundColor(statusBarColor, true);
    }
  }, [isScrolled]);

  // Also set status bar when page is focused and reset scroll position
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(theme.colors.statusBarBackground, true);
      }
      
      // Reset scroll position to top when page is focused
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // Reset scroll states
      setScrollProgress(0);
      setIsAtBottom(false);
      setShowEndIndicator(false);
      setIsScrolled(false);
    }, [])
  );

  const toggleAlarm = (alarmId: string) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const newEnabled = !alarm.enabled;
        
        // If this alarm has snooze state, always reset it when toggling
        if (alarm.isSnoozed) {
          console.log('🔄 Resetting snoozed alarm to original settings:', alarm.originalTime);
          return {
            ...alarm,
            enabled: newEnabled,
            // Reset snooze state back to original alarm
            time: alarm.originalTime || alarm.time,
            days: alarm.originalDays || alarm.days,
            isSnoozed: false,
            originalTime: undefined,
            originalDays: undefined,
            snoozeDuration: undefined,
            snoozeUntilTime: undefined,
            snoozeTimestamp: undefined,
          };
        }
        
        // Normal toggle for non-snoozed alarms
        return { ...alarm, enabled: newEnabled };
      }
      return alarm;
    });
    saveAlarms(updatedAlarms);
    console.log('🔄 Toggled alarm, updating service immediately');
    // Update the alarm service immediately
    alarmService.startChecking(
      updatedAlarms,
      settings.soundEnabled ?? true,
      settings.vibrationEnabled ?? true
    );
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
            console.log('🗑️ Deleted alarm, updating service immediately');
            // Update the alarm service immediately
            if (updatedAlarms.length > 0) {
              alarmService.startChecking(
                updatedAlarms,
                settings.soundEnabled ?? true,
                settings.vibrationEnabled ?? true
              );
            } else {
              alarmService.stopChecking();
            }
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
    <View style={[styles.container, { backgroundColor: theme.colors.headerBackground }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Platform.OS === 'android' ? theme.colors.statusBarBackground : undefined} 
        translucent={true} 
      />
      <View style={[
        styles.headerContainer, 
        { backgroundColor: isScrolled ? theme.colors.headerBackground : theme.colors.background }
      ]}>
        <SafeAreaView style={[
          styles.headerSafeArea,
          { backgroundColor: isScrolled ? theme.colors.headerBackground : theme.colors.background }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>Alarms</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>
      
      <View style={styles.contentContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={true}
          indicatorStyle="white"
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
          
          {/* End spacing for visual breathing room */}
          {alarms.length > 0 && (
            <View style={styles.endSpacing} />
          )}
        </ScrollView>
      </View>

      <AddAlarmModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(newAlarm: any) => {
          const updatedAlarms = [...alarms, newAlarm];
          saveAlarms(updatedAlarms);
          console.log('💾 Saved new alarm, updating service immediately');
          // Update the alarm service immediately with the new alarm
          alarmService.startChecking(
            updatedAlarms,
            settings.soundEnabled ?? true,
            settings.vibrationEnabled ?? true
          );
          setShowAddModal(false);
        }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient
          colors={theme.colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingActionButtonGradient}
        >
          <Plus size={32} color={theme.colors.text.primary} strokeWidth={1.2} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    // Removed static backgroundColor - will be set dynamically
  },
  headerSafeArea: {
    // Removed static backgroundColor - will be set dynamically  
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Back to space-between for title positioning
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'], // Back to 3xl (30px)
    fontFamily: theme.typography.fontFamily.medium, // Keep medium (less bold)
    color: theme.colors.text.primary,
  },
  headerPlaceholder: {
    width: 40, // Same width as original add button for layout balance
    height: 40,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 115, // 110px distance from navigation bar
    right: 20, // Keep at bottom right
    width: 70, // 70px diameter
    height: 70, // 70px diameter
    borderRadius: 35, // Half of 70px for perfect circle
    ...theme.shadows.md,
    elevation: 8, // Higher elevation for floating effect
    zIndex: 999, // Ensure it's above other elements
  },
  floatingActionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35, // Half of 70px for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
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
  endSpacing: {
    height: theme.spacing.xl * 2, // Extra spacing at the end for visual breathing room
    marginTop: theme.spacing.lg,
  },
});