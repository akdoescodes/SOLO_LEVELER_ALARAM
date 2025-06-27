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
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  alarmTime: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  alarmName: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  progressText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  progressSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  instructionContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructionSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  quoteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  animatedContainer: {
    width: '100%',
  },
  fullScreenQuoteCard: {
    width: '100%',
    height: '100%',
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    marginHorizontal: 0,
  },
  swipeHint: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  swipeIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeArrowText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  swipeHintText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});