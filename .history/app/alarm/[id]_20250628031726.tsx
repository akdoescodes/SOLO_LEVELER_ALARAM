import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStorage } from '@/hooks/useStorage';
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { Quote } from '@/types';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function AlarmScreen() {
  const { id } = useLocalSearchParams();
  const { alarms, quotes, settings } = useStorage();
  const { stopAlarm } = useAlarmManager(alarms, settings.soundEnabled, settings.vibrationEnabled);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [swipedQuotes, setSwipedQuotes] = useState(0);
  const [shuffledQuotes, setShuffledQuotes] = useState<Quote[]>([]);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const alarm = alarms.find(a => a.id === id);

  useEffect(() => {
    // Hide status bar for full screen experience
    StatusBar.setHidden(true);
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  useEffect(() => {
    // Shuffle quotes and pick required number
    const shuffled = [...quotes].sort(() => Math.random() - 0.5);
    const selectedQuotes = shuffled.slice(0, Math.max(settings.quotesRequired, 1));
    setShuffledQuotes(selectedQuotes);
  }, [quotes, settings.quotesRequired]);

  useEffect(() => {
    // Trigger haptic feedback when alarm starts
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      const vibrationPattern = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 3000);

      return () => clearInterval(vibrationPattern);
    }
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    // Subtle pulsing animation for the alarm time
    pulseScale.value = withRepeat(
      withTiming(1.05, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pulseScale]);

  const onSwipeComplete = async () => {
    const newSwipedCount = swipedQuotes + 1;
    setSwipedQuotes(newSwipedCount);

    if (newSwipedCount >= settings.quotesRequired) {
      // All quotes swiped, dismiss alarm
      await stopAlarm(id as string);
      router.back();
    } else {
      // Move to next quote
      setCurrentQuoteIndex((prev) => (prev + 1) % shuffledQuotes.length);
      translateX.value = 0;
      opacity.value = 1;
      scale.value = 1;
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (Platform.OS !== 'web') {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      opacity.value = interpolate(progress, [0, 1], [1, 0.3], 'clamp');
      scale.value = interpolate(progress, [0, 1], [0.95, 0.85], 'clamp');
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Complete the swipe
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { damping: 20, stiffness: 90 }
        );
        opacity.value = withSpring(0);
        scale.value = withSpring(0.8);
        runOnJS(onSwipeComplete)();
      } else {
        // Return to center
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  if (!alarm || shuffledQuotes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1F2937', '#111827']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentQuote = shuffledQuotes[currentQuoteIndex % shuffledQuotes.length];
  const progress = (swipedQuotes / settings.quotesRequired) * 100;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient 
        colors={currentQuote.gradientColors || ['#667eea', '#764ba2', '#f093fb']} 
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Top Section - Alarm Info */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.alarmInfo, pulseAnimatedStyle]}>
          <Clock size={32} color="#FFFFFF" />
          <Text style={styles.alarmTime}>{alarm.time}</Text>
          <Text style={styles.alarmName}>{alarm.name}</Text>
        </Animated.View>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {swipedQuotes} / {settings.quotesRequired}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>quotes completed</Text>
        </View>
      </View>

      {/* Quote Section */}
      <View style={styles.quoteSection}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.quoteContainer, animatedStyle]}>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>
                &ldquo;{currentQuote.text}&rdquo;
              </Text>
              {currentQuote.author && (
                <Text style={styles.quoteAuthor}>
                  — {currentQuote.author}
                </Text>
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Bottom Section - Instructions */}
      <View style={styles.bottomSection}>
        <View style={styles.swipeHint}>
          <ArrowLeft size={24} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.swipeText}>Swipe to continue</Text>
          <ArrowRight size={24} color="rgba(255, 255, 255, 0.7)" />
        </View>
        <Text style={styles.instructionText}>
          Read and reflect on the quote
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  topSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  alarmInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  alarmTime: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  alarmName: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  progressSection: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  quoteContainer: {
    width: '100%',
    alignItems: 'center',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    minHeight: 200,
    justifyContent: 'center',
    maxWidth: SCREEN_WIDTH - 40,
  },
  quoteText: {
    fontSize: 22,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 20,
  },
  quoteAuthor: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSection: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    alignItems: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  swipeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 15,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});