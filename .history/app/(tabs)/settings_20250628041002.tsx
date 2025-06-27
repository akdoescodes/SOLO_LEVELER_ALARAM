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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  aboutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  aboutTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});