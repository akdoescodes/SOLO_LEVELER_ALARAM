import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '@/hooks/useStorage';
import { Volume2, Vibrate, Clock, Plus, Minus } from 'lucide-react-native';
import { theme, commonStyles } from '@/constants/theme';
import { GradientIcon } from '@/components/GradientIcon';
import { IconWithLabel } from '@/components/IconWithLabel';

export default function SettingsScreen() {
  const { settings, saveSettings, loaded } = useStorage();

  const updateSetting = (key: keyof typeof settings, value: any) => {
    saveSettings({ ...settings, [key]: value });
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alarm Settings</Text>
            
            <View style={[styles.settingCard, commonStyles.glassCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <IconWithLabel icon={Volume2} size={20}>
                    <Text style={styles.settingLabel}>Sound</Text>
                    <Text style={styles.settingDescription}>
                      Play sound when alarm rings
                    </Text>
                  </IconWithLabel>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ 
                    false: theme.colors.border.primary, 
                    true: theme.colors.gradient.primary[0] 
                  }}
                  thumbColor={settings.soundEnabled ? theme.colors.text.primary : theme.colors.text.secondary}
                />
              </View>
            </View>

            <View style={[styles.settingCard, commonStyles.glassCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <IconWithLabel icon={Vibrate} size={20}>
                    <Text style={styles.settingLabel}>Vibration</Text>
                    <Text style={styles.settingDescription}>
                      Vibrate when alarm rings
                    </Text>
                  </IconWithLabel>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ 
                    false: theme.colors.border.primary, 
                    true: theme.colors.gradient.primary[0] 
                  }}
                  thumbColor={settings.vibrationEnabled ? theme.colors.text.primary : theme.colors.text.secondary}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quote Settings</Text>
            
            <View style={[styles.settingCard, commonStyles.glassCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <IconWithLabel icon={Clock} size={20}>
                    <Text style={styles.settingLabel}>Quotes Required</Text>
                    <Text style={styles.settingDescription}>
                      Number of quotes to swipe through
                    </Text>
                  </IconWithLabel>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateSetting('quotesRequired', Math.max(1, settings.quotesRequired - 1))}
                  >
                    <GradientIcon icon={Minus} size={18} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{settings.quotesRequired}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateSetting('quotesRequired', Math.min(10, settings.quotesRequired + 1))}
                  >
                    <GradientIcon icon={Plus} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.aboutCard, commonStyles.glassCard]}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>
              Wake up with inspiration! This alarm app requires you to swipe through your favorite quotes to stop the alarm, ensuring you start your day with motivation.
            </Text>
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md, // Reduced from lg to md
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md, // Reduced from lg to md
  },
  scrollViewContent: {
    paddingBottom: 100, // Account for tab bar height + extra spacing
  },
  section: {
    marginBottom: theme.spacing.lg, // Reduce from xl (32px) to lg (24px)
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  settingCard: {
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm, // Reduced from md to sm
    paddingHorizontal: theme.spacing.md, // Reduced from lg to md
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    marginTop: 2, // Add a small margin to separate from the label
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  aboutCard: {
    marginBottom: theme.spacing.md, // Match QuoteCard spacing (16px instead of 32px)
    padding: theme.spacing.md, // Reduced from lg to md
  },
  aboutTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  versionContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  versionText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
  },
});