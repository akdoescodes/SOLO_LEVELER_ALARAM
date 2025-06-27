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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

export default function AlarmScreen() {
  const { id } = useLocalSearchParams();
  const { alarms, quotes, settings } = useStorage();
  const { stopAlarm } = useAlarmManager(alarms, settings.soundEnabled, settings.vibrationEnabled);
  const [quotesToShow, setQuotesToShow] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const alarm = alarms.find(a => a.id === id);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(() => {
    // Get required number of random quotes
    const shuffled = [...quotes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.max(settings.quotesRequired, 1));
    setQuotesToShow(selected);
  }, [quotes, settings.quotesRequired]);

  useEffect(() => {
    // Haptic feedback pattern
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      const interval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    // Subtle pulse animation
    pulseScale.value = withRepeat(
      withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const onSwipeComplete = async () => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= quotesToShow.length) {
      // All quotes swiped - dismiss alarm
      await stopAlarm(id as string);
      router.back();
    } else {
      // Move to next quote
      setCurrentIndex(nextIndex);
      // Reset animation values for next card
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
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      opacity.value = interpolate(progress, [0, 1], [1, 0.3], 'clamp');
      scale.value = interpolate(progress, [0, 1], [1, 0.8], 'clamp');
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Complete the swipe
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { damping: 15, stiffness: 150 }
        );
        opacity.value = withSpring(0);
        scale.value = withSpring(0.5, {}, () => {
          runOnJS(onSwipeComplete)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        scale.value = withSpring(1);
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

  if (!alarm || quotesToShow.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1F2937', '#111827']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentQuote = quotesToShow[currentIndex];
  const progress = ((currentIndex) / quotesToShow.length) * 100;
  const remaining = quotesToShow.length - currentIndex;

  return (
    <View style={styles.container}>
      {/* Dynamic Background */}
      <LinearGradient 
        colors={currentQuote.gradientColors as any || ['#667eea', '#764ba2']} 
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[styles.alarmInfo, pulseAnimatedStyle]}>
          <Text style={styles.alarmTime}>{alarm.time}</Text>
          <Text style={styles.alarmName}>{alarm.name}</Text>
        </Animated.View>
        
        <View style={styles.progressInfo}>
          <Text style={styles.remainingText}>
            {remaining} quote{remaining !== 1 ? 's' : ''} remaining
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      {/* Quote Cards Stack */}
      <View style={styles.cardsContainer}>
        {/* Background cards (stack effect) */}
        {quotesToShow.slice(currentIndex + 1, currentIndex + 3).map((quote, index) => (
          <View
            key={`bg-${currentIndex + index + 1}`}
            style={[
              styles.backgroundCard,
              {
                transform: [
                  { scale: 0.95 - (index * 0.02) },
                  { translateY: -10 - (index * 5) }
                ],
                opacity: 0.7 - (index * 0.2)
              }
            ]}
          />
        ))}
        
        {/* Current card */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.quoteCard, cardAnimatedStyle]}>
            <View style={styles.quoteContent}>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.instructionText}>
          Swipe left or right to continue
        </Text>
        <Text style={styles.subText}>
          Read each quote to dismiss the alarm
        </Text>
      </View>
    </View>
  );
}
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