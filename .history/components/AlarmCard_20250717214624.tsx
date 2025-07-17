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
            <Text style={styles.days}>
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
                    <Text style={[styles.dayText, { color: theme.colors.text.primary }]}>
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
          {alarm.enabled && (
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientOverlay}
            />
          )}
          <View style={styles.content}>
            <View style={styles.leftContent}>
              <Text style={[styles.time, { color: alarm.enabled ? theme.colors.text.primary : 'rgba(255, 255, 255, 0.5)' }]}>
                {alarm.time}
              </Text>
              <View style={styles.infoRow}>
                {renderDayIndicators()}
              </View>
            </View>
            
            <View style={styles.rightContent}>
              <Switch
                value={alarm.enabled}
                onValueChange={onToggle}
                trackColor={{ 
                  false: 'rgba(255, 255, 255, 0.3)', 
                  true: theme.colors.gradient.primary[0] 
                }}
                thumbColor="white"
                ios_backgroundColor="rgba(255, 255, 255, 0.3)"
                style={styles.switch}
              />
              <View style={styles.menuContainer}>
                <TouchableOpacity 
                  style={styles.menuButton} 
                  onPress={handleMenuPress}
                >
                  {alarm.enabled ? (
                    <GradientIcon icon={MoreVertical} size={20} />
                  ) : (
                    <MoreVertical size={20} color={theme.colors.text.secondary} />
                  )}
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
    marginBottom: theme.spacing.md,
    position: 'relative', // Allow absolute positioning for dropdown
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md, // Reduced from lg to md
    paddingVertical: theme.spacing.sm, // Even less vertical padding
    position: 'relative',
    // Remove overflow: 'hidden' to allow dropdown to extend outside
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
  time: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
  },
  infoRow: {
    marginTop: theme.spacing.sm,
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
  soundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  rightContent: {
    alignItems: 'center',
  },
  switch: {
    marginBottom: theme.spacing.sm,
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
  menuContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    // Removed background for cleaner look
  },
  daySquaresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.xs, // Same margin as between calendar icon and text
    gap: theme.spacing.xs / 2, // Reduced gap between day letters
    flexWrap: 'wrap',
  },
  daySquare: {
    width: 16, // Smaller width
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Clean look with no background or border
  },
  dayText: {
    fontSize: theme.typography.fontSize.xs, // 12px based on theme
    fontFamily: theme.typography.fontFamily.regular, // Match the "One time" text style
    textAlign: 'center',
  },
  dayTextInactive: {
    color: 'rgba(255, 255, 255, 0.3)', // More subtle for unselected days
  },
});