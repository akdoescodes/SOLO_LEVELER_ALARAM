import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { Trash2, Calendar, Music, MoreVertical } from 'lucide-react-native';
import { Alarm } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: () => void;
  onDelete: () => void;
}

export function AlarmCard({ alarm, onToggle, onDelete }: AlarmCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const slideAnimation = useSharedValue(SCREEN_WIDTH);

  const getDaysText = () => {
    if (alarm.days.length === 0) return 'One time';
    if (alarm.days.length === 7) return 'Every day';
    return alarm.days.join(', ');
  };

  const handleMenuPress = () => {
    setShowMenu(true);
    slideAnimation.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
  };

  const closeMenu = () => {
    slideAnimation.value = withTiming(SCREEN_WIDTH, {
      duration: 250,
    });
    setTimeout(() => setShowMenu(false), 250);
  };

  const handleDelete = () => {
    closeMenu();
    setTimeout(() => onDelete(), 300);
  };

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnimation.value }],
  }));

  return (
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
              <View style={styles.daysContainer}>
                <Calendar size={14} color={theme.colors.text.secondary} />
                <Text style={styles.days}>{getDaysText()}</Text>
              </View>
              {alarm.soundName && (
                <View style={styles.soundContainer}>
                  <Music size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.soundText}>{alarm.soundName}</Text>
                </View>
              )}
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
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={handleMenuPress}
            >
              <MoreVertical size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Contextual Menu Modal */}
          <Modal
            visible={showMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            >
              <View 
                style={[
                  styles.contextMenu,
                  {
                    position: 'absolute',
                    top: menuPosition.y,
                    left: menuPosition.x,
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleDelete}
                >
                  <Text style={styles.menuItemText}>Delete</Text>
                </TouchableOpacity>
                
                {/* Future menu items can be added here */}
                {/* 
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                  <Text style={styles.menuItemTextNormal}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleDuplicate}>
                  <Text style={styles.menuItemTextNormal}>Duplicate</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                  <Text style={styles.menuItemTextNormal}>Share</Text>
                </TouchableOpacity>
                */}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
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
  menuButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  contextMenu: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    minWidth: 120,
    maxWidth: 160,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    minWidth: 160,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  menuItemText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.error,
  },
  menuItemTextNormal: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
});