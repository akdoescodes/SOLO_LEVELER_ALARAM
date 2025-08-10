import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { alarmService } from '@/services/AlarmService';
import { useStorage } from '@/hooks/useStorage';

export default function ProfessionalAlarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alarms, quotes, settings } = useStorage();
  
  // Stable quote storage - NEVER reshuffles after initial load
  const quotesRef = useRef<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the alarm data
  const alarm = alarms.find(a => a.id === id);
  
  // Initialize quotes ONCE and ONLY ONCE
  useEffect(() => {
    // Only initialize if we don't have quotes yet
    if (quotesRef.current.length === 0 && quotes.length > 0) {
      console.log('🎯 Initializing quotes for alarm screen - ONE TIME ONLY');
      
      // Shuffle and select quotes
      const shuffled = [...quotes].sort(() => Math.random() - 0.5);
      const required = Math.max(settings.quotesRequired || 3, 1);
      const selected = shuffled.slice(0, required);
      
      // Store in ref - this will NEVER change during the alarm session
      quotesRef.current = selected;
      setIsLoading(false);
      
      console.log(`✅ Loaded ${selected.length} quotes permanently for this alarm session`);
    } else if (quotesRef.current.length > 0) {
      // Quotes already loaded
      setIsLoading(false);
    }
  }, [quotes.length, settings.quotesRequired]); // Minimal dependencies
  
  // Handle quote navigation
  const handleNextQuote = useCallback(() => {
    if (currentIndex < quotesRef.current.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All quotes completed - dismiss alarm
      handleDismissAlarm();
    }
  }, [currentIndex]);
  
  // Handle alarm dismissal
  const handleDismissAlarm = useCallback(async () => {
    if (!id) return;
    
    console.log('🏁 Dismissing alarm:', id);
    
    try {
      // Stop the alarm through the service
      await alarmService.stopAlarm(id);
      
      // Update alarm data if needed (mark as triggered, update stats, etc.)
      // ... your existing alarm update logic
      
      console.log('✅ Alarm dismissed successfully');
    } catch (error) {
      console.error('Error dismissing alarm:', error);
    }
  }, [id]);
  
  // Handle loading state
  if (isLoading || quotesRef.current.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading alarm...</Text>
      </View>
    );
  }
  
  // Handle missing alarm
  if (!alarm) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Alarm not found</Text>
      </View>
    );
  }
  
  const currentQuote = quotesRef.current[currentIndex];
  const isLastQuote = currentIndex === quotesRef.current.length - 1;
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Alarm Info */}
      <View style={styles.alarmInfo}>
        <Text style={styles.timeText}>{alarm.time}</Text>
        <Text style={styles.labelText}>{alarm.label}</Text>
      </View>
      
      {/* Quote Display */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{currentQuote?.text || 'No quote available'}</Text>
        <Text style={styles.authorText}>— {currentQuote?.author || 'Unknown'}</Text>
      </View>
      
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Quote {currentIndex + 1} of {quotesRef.current.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / quotesRef.current.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {isLastQuote ? 'Swipe to dismiss alarm' : 'Swipe to continue'}
        </Text>
      </View>
      
      {/* Gesture Handler for swiping - you'd implement this */}
      {/* <PanGestureHandler onGestureEvent={handleSwipe}> */}
        <View style={styles.swipeArea} onTouchEnd={handleNextQuote}>
          <Text style={styles.swipeText}>👆 Tap to {isLastQuote ? 'dismiss' : 'continue'}</Text>
        </View>
      {/* </PanGestureHandler> */}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
  },
  alarmInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  labelText: {
    color: '#ccc',
    fontSize: 18,
    marginTop: 8,
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quoteText: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
  },
  authorText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  swipeArea: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    alignItems: 'center',
  },
  swipeText: {
    color: '#007AFF',
    fontSize: 16,
  },
};
