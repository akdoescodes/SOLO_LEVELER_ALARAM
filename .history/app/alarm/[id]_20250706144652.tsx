import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, StatusBar, Switch } from 'react-native';
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
import { useAlarmManager } from '@/hooks/useAlarmManager';
import { Quote } from '@/types';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

export default function AlarmScreen() {
  const { id } = useLocalSearchParams();
  const { alarms, quotes, settings, saveAlarms } = useStorage();
  const { stopAlarm } = useAlarmManager(alarms, settings.soundEnabled, settings.vibrationEnabled);
  const [quotesToShow, setQuotesToShow] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const alarm = alarms.find(a => a.id === id);

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
      // Move to next quote with smooth transition
      setCurrentIndex(nextIndex);
      // Reset animation values for next card with slight delay for smoothness
      setTimeout(() => {
        translateX.value = 0;
        opacity.value = withTiming(1, { duration: 300 });
        scale.value = withTiming(1, { duration: 300 });
      }, 100);
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
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.background }]} />
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
          <View style={styles.alarmRow}>
            <Text style={[styles.alarmTime, { color: alarm.enabled ? 'white' : 'rgba(255, 255, 255, 0.5)' }]}>
              {alarm.time}
            </Text>
            <View style={styles.switchContainer}>
              <Switch
                value={alarm.enabled}
                onValueChange={toggleAlarm}
                trackColor={{ 
                  false: 'rgba(255, 255, 255, 0.3)', 
                  true: theme.colors.gradient.primary[0] 
                }}
                thumbColor="white"
                ios_backgroundColor="rgba(255, 255, 255, 0.3)"
                style={styles.switch}
              />
            </View>
          </View>
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
        {quotesToShow.slice(currentIndex + 1, currentIndex + 4).map((quote, index) => (
          <Animated.View
            key={`bg-${currentIndex + index + 1}`}
            style={[
              styles.backgroundCard,
              {
                transform: [
                  { scale: 0.95 - (index * 0.03) },
                  { translateY: -15 - (index * 8) }
                ],
                opacity: 0.8 - (index * 0.25),
                zIndex: 3 - index
              }
            ]}
          >
            <LinearGradient 
              colors={quote.gradientColors as any || ['#667eea', '#764ba2']} 
              style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
            />
          </Animated.View>
        ))}
        
        {/* Current card */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.quoteCard, cardAnimatedStyle, { zIndex: 10 }]}>
            <LinearGradient 
              colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)', 'rgba(250,250,250,0.9)']} 
              style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
            />
            <View style={styles.quoteContent}>
              <View style={styles.quoteHeader}>
                <Text style={styles.quoteNumber}>
                  {currentIndex + 1} of {quotesToShow.length}
                </Text>
              </View>
              <Text style={styles.quoteText}>
                &ldquo;{currentQuote.text}&rdquo;
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
  alarmTime: {
    fontSize: 40,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flex: 1,
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
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  quoteHeader: {
    position: 'absolute',
    top: 25,
    right: 25,
  },
  quoteNumber: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    overflow: 'hidden',
    letterSpacing: 0.2,
  },
  quoteText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#2a2a2a',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 12,
    letterSpacing: 0.2,
  },
  quoteAuthor: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#888',
    textAlign: 'center',
    letterSpacing: 0.5,
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
});