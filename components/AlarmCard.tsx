import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Calendar, Music, MoreVertical } from 'lucide-react-native';
import { Alarm } from '@/types';
import { theme, commonStyles } from '@/constants/theme';
import { ContextMenu } from './ContextMenu';
import { GradientText } from './GradientText';
import { GradientIcon } from './GradientIcon';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: () => void;
  onDelete: () => void;
}

export function AlarmCard({ alarm, onToggle, onDelete }: AlarmCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const getDaysText = () => {
    if (alarm.days.length === 0) return 'One time';
    if (alarm.days.length === 7) return 'Every day';
    return alarm.days.join(', ');
  };

  const renderDayIndicators = () => {
    if (alarm.days.length === 0 || alarm.days.length === 7) {
      return (
        <View style={styles.daysContainer}>
          {alarm.enabled ? (
            <GradientIcon icon={Calendar} size={14} />
          ) : (
            <Calendar size={14} color={theme.colors.text.secondary} />
          )}
          {alarm.enabled ? (
            <GradientText
              style={styles.days}
              colors={theme.colors.gradient.primary}
            >
              {getDaysText()}
            </GradientText>
          ) : (
            <Text style={[styles.days, { color: theme.colors.text.secondary }]}>
              {getDaysText()}
            </Text>
          )}
        </View>
      );
    }

    // Show individual day squares for specific days
    const dayAbbreviations = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return (
      <View style={styles.daysContainer}>
        {alarm.enabled ? (
          <GradientIcon icon={Calendar} size={14} />
        ) : (
          <Calendar size={14} color={theme.colors.text.secondary} />
        )}
        <View style={styles.daySquaresContainer}>
          {dayAbbreviations.map((dayAbbr, index) => {
            const dayName = dayNames[index];
            const isSelected = alarm.days.includes(dayName);
            
            return (
              <View key={index} style={styles.daySquare}>
                {isSelected ? (
                  alarm.enabled ? (
                    <GradientText
                      style={styles.dayText}
                      colors={theme.colors.gradient.primary}
                    >
                      {dayAbbr}
                    </GradientText>
                  ) : (
                    <Text style={[styles.dayText, { color: theme.colors.text.secondary }]}>
                      {dayAbbr}
                    </Text>
                  )
                ) : (
                  <Text style={[styles.dayText, styles.dayTextInactive]}>
                    {dayAbbr}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    // More accurate positioning for consistent cross-platform behavior
    setButtonPosition({ 
      x: pageX, 
      y: pageY + (Platform.OS === 'web' ? -10 : -5) // Slight upward adjustment for both platforms
    });
    setShowMenu(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete();
  };

  return (
    <>
      <View style={styles.container}>
        <View style={[styles.card, commonStyles.glassCard]}>
          {/* Removed gradient overlay */}
          <View style={styles.content}>
            <View style={styles.leftContent}>
              <View style={styles.timeContainer}>
                <Text style={[styles.time, { color: alarm.enabled ? theme.colors.text.primary : 'rgba(255, 255, 255, 0.5)' }]}>
                  {alarm.time}
                </Text>
                {alarm.isSnoozed && alarm.enabled && (
                  <View style={styles.snoozeIndicator}>
                    <Text style={styles.snoozeText}>ZZ</Text>
                  </View>
                )}
              </View>
              {alarm.isSnoozed && alarm.enabled && alarm.snoozeUntilTime && (
                <Text style={styles.snoozeUntilText}>until {alarm.snoozeUntilTime}</Text>
              )}
              <View style={styles.infoRow}>
                {renderDayIndicators()}
              </View>
            </View>
            
            <View style={styles.rightContent}>
              <Switch
                value={alarm.enabled}
                onValueChange={onToggle}
                trackColor={{ 
                  false: 'rgba(255, 255, 255, 0.15)', 
                  true: theme.colors.gradient.primary[0] // Green color when on
                }}
                thumbColor={alarm.enabled ? theme.colors.text.primary : "rgba(255, 255, 255, 0.9)"} // White thumb
                ios_backgroundColor="rgba(255, 255, 255, 0.15)"
                style={styles.switch}
              />
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuButton} 
                  onPress={handleMenuPress}
                >
                  <MoreVertical size={20} color={alarm.enabled ? theme.colors.text.primary : theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Context Menu Component */}
      <ContextMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        buttonPosition={buttonPosition}
        onDelete={handleDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
    position: 'relative', // Allow absolute positioning for dropdown
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    position: 'relative',
    ...theme.shadows.md,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  leftContent: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  time: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
  },
  snoozeIndicator: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    borderRadius: 4, // Very small radius for subtle badge
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    alignSelf: 'flex-start',
    marginLeft: 4,
    minWidth: 18,
    alignItems: 'center',
  },
  snoozeText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFA500',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  snoozeUntilText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 165, 0, 0.7)',
    letterSpacing: 0.2,
    marginTop: -2,
    marginLeft: 4,
  },
  infoRow: {
    marginTop: theme.spacing.xs,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  days: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  rightContent: {
    alignItems: 'center',
  },
  switch: {
    marginBottom: theme.spacing.xs,
    ...Platform.select({
      ios: {
        transform: [{ scaleX: 1.12 }, { scaleY: 1.12 }], // Bigger on iOS
      },
      android: {
        transform: [{ scaleX: 1.12 }, { scaleY: 1.12 }], // Bigger on Android
      },
      web: {
        transform: [{ scale: 1.2 }], // Bigger on web
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth professional animation
      },
    }),
  },
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  daySquaresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
    gap: theme.spacing.xs / 4,
    flexWrap: 'nowrap',
    flex: 1,
  },
  daySquare: {
    width: 14,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
  },
  dayTextInactive: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});