import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '@/hooks/useStorage';
import { Volume2, Vibrate, Clock } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function SettingsScreen() {
  const { settings, saveSettings, loaded } = useStorage();

  const updateSetting = (key: keyof typeof settings, value: any) => {
    saveSettings({ ...settings, [key]: value });
  };

  if (!loaded) {
    return (
      <LinearGradient colors={[theme.colors.surface.secondary, theme.colors.background]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.colors.surface.secondary, theme.colors.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alarm Settings</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Volume2 size={24} color={theme.colors.text.accent} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Text style={styles.settingDescription}>
                    Play sound when alarm rings
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSetting('soundEnabled', value)}
                trackColor={{ false: theme.colors.border.primary, true: theme.colors.text.accent }}
                thumbColor={settings.soundEnabled ? theme.colors.text.primary : theme.colors.text.secondary}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Vibrate size={24} color={theme.colors.text.accent} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDescription}>
                    Vibrate when alarm rings
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                trackColor={{ false: theme.colors.border.primary, true: theme.colors.text.accent }}
                thumbColor={settings.vibrationEnabled ? theme.colors.text.primary : theme.colors.text.secondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quote Settings</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Clock size={24} color={theme.colors.text.accent} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Quotes Required</Text>
                  <Text style={styles.settingDescription}>
                    Number of quotes to swipe through: {settings.quotesRequired}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>
              Wake up with inspiration! This alarm app requires you to swipe through your favorite quotes to stop the alarm, ensuring you start your day with motivation.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border.primary,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
  },
  settingDescription: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  aboutSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl + theme.spacing.sm,
  },
  aboutTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  aboutText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  loadingText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});