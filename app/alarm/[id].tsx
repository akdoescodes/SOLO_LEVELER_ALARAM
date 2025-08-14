import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  interpolate,
  withTiming,
  withRepeat,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStorage } from '@/hooks/useStorage';
import { alarmService } from '@/services/AlarmService';
import { WakeUpStatsManager } from '@/utils/wakeUpStats';
import { Quote } from '@/types';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

export default function AlarmScreen() {
  const { id } = useLocalSearchParams();
  const { alarms, quotes, settings, saveAlarms } = useStorage();
  
  // 🚀 PROFESSIONAL: Use alarm service directly instead of recreating hook
  const stopAlarm = async (alarmId: string) => {
    await alarmService.stopAlarm(alarmId);
  };
  
  // 🎯 PROFESSIONAL: Pure ref-based quotes - NEVER reshuffle after initialization
  const quotesRef = useRef<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [alarmStopped, setAlarmStopped] = useState<boolean>(false);
  const [isSnoozed, setIsSnoozed] = useState<boolean>(false);
  const [snoozeUntilTime, setSnoozeUntilTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  
  // For background cards fade effect
  const swipeProgress = useSharedValue(0);
  
  // For flowing gradient effect inside quote cards
  const gradientFlow = useSharedValue(0);
  const gradientIntensity = useSharedValue(0);

  const alarm = alarms.find(a => a.id === id);

  // Get current system time for display (always shows current time when alarm screen is active)
  const getCurrentDisplayTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Update current time every second
  useEffect(() => {
    // Set initial time
    setCurrentTime(getCurrentDisplayTime());
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentDisplayTime());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const toggleAlarm = async () => {
    if (alarm) {
      const updatedAlarms = alarms.map(a => 
        a.id === alarm.id ? { ...a, enabled: !a.enabled } : a
      );
      await saveAlarms(updatedAlarms);
    }
  };

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  // Use a ref to store quotes to prevent reshuffling on re-renders
  // 🎯 PROFESSIONAL: Initialize quotes ONCE and ONLY ONCE - NEVER reshuffle
  useEffect(() => {
    // Only initialize if we don't have quotes yet AND we have data to work with
    if (quotesRef.current.length === 0 && quotes.length > 0) {
      console.log('🎯 PROFESSIONAL: Initializing quotes ONE TIME ONLY for alarm:', id);
      
      // Shuffle and select quotes
      const shuffled = [...quotes].sort(() => Math.random() - 0.5);
      const required = Math.max(settings.quotesRequired || 3, 1);
      const selected = shuffled.slice(0, required);
      
      // Store in ref - this will NEVER change during the alarm session
      quotesRef.current = selected;
      setIsLoading(false);
      
      console.log(`✅ PROFESSIONAL: Loaded ${selected.length} quotes permanently for this alarm session`);
    } else if (quotesRef.current.length > 0) {
      // Quotes already loaded
      setIsLoading(false);
    }
  }, [quotes.length, settings.quotesRequired, id]); // Minimal dependencies

  // Handle haptic feedback - once when quotes are loaded
  useEffect(() => {
    // Only run once when component has quotes loaded and not stopped
    if (quotesRef.current.length === 0 || alarmStopped || !settings.vibrationEnabled || Platform.OS === 'web') {
      return;
    }
    
    console.log('Setting up haptic feedback');
    
    // Initial haptic feedback when alarm screen loads
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Set up interval for continuous feedback with a ref to track it
    const hapticInterval = setInterval(() => {
      if (alarmStopped) {
        console.log('Stopping haptic feedback due to alarm stopped');
        clearInterval(hapticInterval);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 2000);
    
    // Clean up on unmount or when dependencies change
    return () => {
      console.log('Cleaning up haptic feedback');
      clearInterval(hapticInterval);
    };
  }, [quotesRef.current.length, alarmStopped]);

  // Set up animation - once when quotes are loaded
  useEffect(() => {
    // Only set up animation when we have quotes loaded
    if (quotesRef.current.length === 0) {
      return;
    }
    
    console.log('Setting up pulse animation');
    
    // Subtle pulse animation
    pulseScale.value = withRepeat(
      withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Flowing gradient animation - creates a mesmerizing fluid effect
    gradientFlow.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Gradient intensity animation - makes the flow more dynamic
    gradientIntensity.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      true
    );
  }, [quotesRef.current.length]);

  const onSwipeComplete = async () => {
    // Safety check - don't proceed if we don't have quotes or are already stopped
    if (quotesRef.current.length === 0 || alarmStopped) {
      console.log('Swipe ignored - no quotes or already stopped');
      return;
    }
    
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= quotesRef.current.length) {
      // Prevent multiple execution
      if (alarmStopped) return;
      
      // All quotes swiped - dismiss alarm
      // Important: Set alarm stopped state first to prevent further haptics/sounds
      setAlarmStopped(true); 
      
      console.log('All quotes swiped, stopping alarm:', id);
      
      try {
        // If this is a snoozed alarm, restore it to original settings
        if (alarm && alarm.isSnoozed) {
          const restoredAlarm = alarmService.restoreOriginalAlarm(alarm.id);
          if (restoredAlarm) {
            const updatedAlarms = alarms.map(a => 
              a.id === alarm.id ? restoredAlarm : a
            );
            await saveAlarms(updatedAlarms);
          }
        }
        
        // Stop the alarm (sound & haptics)
        await stopAlarm(id as string);
        
        // Record wake-up time for statistics
        await WakeUpStatsManager.recordWakeUp();
        
        // Return to home screen (safer than router.back())
        router.replace('/');
      } catch (error) {
        console.log('Error during alarm dismissal:', error);
      }
    } else {
      // Move to next quote with smooth transition
      console.log('Moving to next quote:', nextIndex, 'of', quotesRef.current.length);
      setCurrentIndex(nextIndex);
      
      // Reset animation values for next card with slight delay for smoothness
      translateX.value = 0;
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
      swipeProgress.value = withTiming(0, { duration: 300 });
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      // Don't allow gesture if already in process of stopping
      if (alarmStopped) return;
      
      // Light haptic feedback on swipe start
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onActive: (event) => {
      // Don't allow gesture if already in process of stopping
      if (alarmStopped) return;
      
      // Apply the swipe movement and visual effects
      translateX.value = event.translationX;
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      opacity.value = interpolate(progress, [0, 1], [1, 0.3], 'clamp');
      scale.value = interpolate(progress, [0, 1], [1, 0.8], 'clamp');
      
      // Track swipe progress for background cards animation
      swipeProgress.value = progress;
    },
    onEnd: (event) => {
      // Don't allow gesture if already in process of stopping
      if (alarmStopped) return;
      
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Complete the swipe animation
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { damping: 15, stiffness: 150 }
        );
        opacity.value = withSpring(0);
        
        // Only call onSwipeComplete after the animation completes
        scale.value = withSpring(0.5, {}, () => {
          runOnJS(onSwipeComplete)();
        });
      } else {
        // Snap back to center position
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
        swipeProgress.value = withSpring(0);
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Create fixed animated styles for background cards (max 3 background cards)
  const backgroundCard0AnimatedStyle = useAnimatedStyle(() => {
    const baseOpacity = 0.1;
    const swipeInfluence = swipeProgress.value * 0.6;
    return {
      opacity: Math.min(1, baseOpacity + swipeInfluence),
    };
  });

  const backgroundCard1AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.6, // Static opacity for second background card
    };
  });

  const backgroundCard2AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.8, // Static opacity for third background card
    };
  });

  // Flowing gradient animated style for quote cards
  const flowingGradientStyle = useAnimatedStyle(() => {
    'worklet';
    
    // Create flowing effect by interpolating opacity and positions
    const flowOpacity = interpolate(
      gradientFlow.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      'clamp'
    );
    
    // Create intensity variation for more dynamic effect
    const intensity = interpolate(
      gradientIntensity.value,
      [0, 1],
      [0.5, 1],
      'clamp'
    );
    
    return {
      opacity: flowOpacity * intensity,
    };
  });

  // Second flowing layer with different timing
  const flowingGradientStyle2 = useAnimatedStyle(() => {
    'worklet';
    
    const flowOpacity = interpolate(
      gradientIntensity.value,
      [0, 0.5, 1],
      [0.2, 0.5, 0.2],
      'clamp'
    );
    
    const scaleEffect = interpolate(
      gradientFlow.value,
      [0, 1],
      [1, 1.1],
      'clamp'
    );
    
    return {
      opacity: flowOpacity,
      transform: [{ scale: scaleEffect }],
    };
  });

  // Show loading screen if explicitly loading or if we're missing essential data
  if (isLoading || !alarm || !quotes.length || quotesRef.current.length === 0) {
    console.log('Showing loading screen, status:', { 
      isLoading, 
      hasAlarm: !!alarm, 
      quotesAvailable: quotes.length, 
      quotesLoaded: quotesRef.current.length 
    });
    
    return (
      <View style={styles.loadingContainer}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.background }]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentQuote = quotesRef.current[currentIndex];
  const progress = ((currentIndex) / quotesRef.current.length) * 100;
  const remaining = quotesRef.current.length - currentIndex;

  return (
    <View style={styles.container}>
      {/* Gradient Background - App Consistent Colors */}
      <LinearGradient 
        colors={['#1a1a1a', '#010101']} // Header color transitioning to app background
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Remove overlay since gradient provides consistent app colors */}
      {/* <View style={styles.translucentOverlay} /> */}

      {/* Main Content Layout */}
      <View style={styles.contentWrapper}>
        {/* Time without box - shows current system time when alarm screen is active */}
        <Text style={styles.alarmTime}>{currentTime}</Text>
        {/* Alarm label if present */}
        {alarm.name ? (
          <Text style={styles.alarmLabel}>{alarm.name}</Text>
        ) : null}
        {/* Quote Cards Stack */}
        <View style={styles.cardsContainer}>
          {/* Background cards (stack effect) */}
          {quotesRef.current.slice(currentIndex + 1, currentIndex + 4).map((quote: Quote, index: number) => {
            // Select the appropriate animated style based on card position
            const getBackgroundCardStyle = () => {
              switch (index) {
                case 0: return backgroundCard0AnimatedStyle;
                case 1: return backgroundCard1AnimatedStyle;
                case 2: return backgroundCard2AnimatedStyle;
                default: return { opacity: 0.4 };
              }
            };
            
            return (
              <Animated.View
                key={`bg-${currentIndex + index + 1}`}
                style={[
                  styles.backgroundCard,
                  {
                    transform: [
                      { scale: 0.95 - (index * 0.03) },
                      { translateY: -15 - (index * 8) }
                    ],
                    zIndex: 3 - index
                  },
                  getBackgroundCardStyle()
                ]}
              >
                <LinearGradient 
                  colors={quote.gradientColors as any || ['#667eea', '#764ba2']} 
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
                />
                
                {/* Subtle flowing effect for background cards too */}
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}>
                  <LinearGradient 
                    colors={[
                      'transparent',
                      `${(quote.gradientColors as any)?.[0] || '#667eea'}30`,
                      'transparent',
                    ]} 
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </Animated.View>
              </Animated.View>
            );
          })}
          {/* Current card */}
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.quoteCard, cardAnimatedStyle, { zIndex: 10 }]}> 
              {/* Base gradient */}
              <LinearGradient 
                colors={currentQuote.gradientColors as any || ['#667eea', '#764ba2']} 
                style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
              />
              
              {/* Flowing gradient overlay for mesmerizing effect */}
              <Animated.View style={[StyleSheet.absoluteFillObject, flowingGradientStyle]}>
                <LinearGradient 
                  colors={[
                    `${(currentQuote.gradientColors as any)?.[0] || '#667eea'}40`, // 25% opacity
                    `${(currentQuote.gradientColors as any)?.[1] || '#764ba2'}60`, // 37% opacity
                    `${(currentQuote.gradientColors as any)?.[0] || '#667eea'}40`, // 25% opacity
                  ]} 
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
              
              {/* Another flowing layer with different timing */}
              <Animated.View style={[StyleSheet.absoluteFillObject, flowingGradientStyle2]}>
                <LinearGradient 
                  colors={[
                    'transparent',
                    `${(currentQuote.gradientColors as any)?.[1] || '#764ba2'}40`,
                    'transparent',
                  ]} 
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
              <View style={styles.quoteContent}>
                <View style={styles.quoteHeader}>
                  <Text style={styles.quoteNumber}>
                    {currentIndex + 1} of {quotesRef.current.length}
                  </Text>
                </View>
                <Text style={styles.quoteText}>
                  "{currentQuote.text}"
                </Text>
                {currentQuote.author && (
                  <Text style={styles.quoteAuthor}>
                    — {currentQuote.author}
                  </Text>
                )}
                <View style={styles.swipeHint}>
                  <Text style={styles.swipeHintText}>← Swipe to continue →</Text>
                </View>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
        {/* Action buttons at the bottom */}
        <View style={styles.actionButtonsContainer}>
          {/* Snooze Button */}
          <TouchableOpacity 
            style={styles.snoozeButton}
            onPress={async () => {
              if (alarm && !isSnoozed) {
                setAlarmStopped(true);
                
                // Snooze the alarm and get the updated alarm data
                const snoozedAlarm = await alarmService.snoozeAlarm(alarm.id);
                
                if (snoozedAlarm) {
                  // Update the storage with the snoozed alarm
                  const updatedAlarms = alarms.map(a => 
                    a.id === alarm.id ? snoozedAlarm : a
                  );
                  await saveAlarms(updatedAlarms);
                  
                  // Show snooze confirmation
                  setIsSnoozed(true);
                  setSnoozeUntilTime(snoozedAlarm.snoozeUntilTime || '');
                  
                  // Wait a moment before navigating to show confirmation
                  setTimeout(() => {
                    WakeUpStatsManager.recordWakeUp();
                    router.replace('/');
                  }, 1500);
                } else {
                  // If snooze failed, just navigate away
                  await WakeUpStatsManager.recordWakeUp();
                  router.replace('/');
                }
              }
            }}
          >
            <Text style={styles.actionButtonText}>Snooze</Text>
          </TouchableOpacity>
          
          {/* Dismiss Button */}
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={async () => {
              if (alarm) {
                setAlarmStopped(true);
                
                // If this is a snoozed alarm, restore it to original settings
                if (alarm.isSnoozed) {
                  const restoredAlarm = alarmService.restoreOriginalAlarm(alarm.id);
                  if (restoredAlarm) {
                    const updatedAlarms = alarms.map(a => 
                      a.id === alarm.id ? restoredAlarm : a
                    );
                    await saveAlarms(updatedAlarms);
                  }
                }
                
                await stopAlarm(id as string);
                await WakeUpStatsManager.recordWakeUp();
                router.replace('/');
              }
            }}
          >
            <Text style={styles.actionButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Snooze Confirmation Overlay */}
      {isSnoozed && (
        <View style={styles.snoozeConfirmationOverlay}>
          <View style={styles.snoozeConfirmationContent}>
            <Text style={styles.snoozeConfirmationTitle}>😴 Alarm Snoozed</Text>
            <Text style={styles.snoozeConfirmationMessage}>
              Your alarm will ring again at{'\n'}
              <Text style={styles.snoozeConfirmationTime}>{snoozeUntilTime}</Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  translucentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#010101', // Full opacity with #010101 color
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  alarmInfo: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  alarmTime: {
    fontSize: 90,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    marginTop: -40,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  alarmLabel: {
    fontSize: 19,
    fontWeight: '500',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: -5,
    marginBottom: 8,
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 40,
  },
  timeBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  quoteCounter: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    marginVertical: 20,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dismissButtonContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.5,
  },
  switchContainer: {
    marginLeft: 20,
  },
  switch: {
    ...Platform.select({
      ios: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
      },
      android: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
      },
      web: {
        // No transform for web to keep it natural
      },
    }),
  },
  progressInfo: {
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  progressBar: {
    width: '90%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backgroundCard: {
    position: 'absolute',
    width: SCREEN_WIDTH - 35,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  quoteCard: {
    width: SCREEN_WIDTH - 30,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
    overflow: 'hidden',
  },
  quoteContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  quoteHeader: {
    position: 'absolute',
    top: 28,
    right: 28,
  },
  quoteNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quoteText: {
    fontSize: 28,
    fontWeight: '500',
    color: 'white',
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 16,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quoteAuthor: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  swipeHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 35,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  snoozeConfirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  snoozeConfirmationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px)',
    alignItems: 'center',
    minWidth: 280,
  },
  snoozeConfirmationTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  snoozeConfirmationMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  snoozeConfirmationTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFA500',
    letterSpacing: 1,
  },
});