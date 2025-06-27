import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '@/hooks/useStorage';
import { Volume2, Vibrate, Clock, Plus, Minus } from 'lucide-react-native';
import { theme, commonStyles } from '@/constants/theme';

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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alarm Settings</Text>
            
            <View style={[styles.settingCard, commonStyles.glassCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={theme.colors.gradient.primary}
                      style={styles.iconGradient}
                    >
                      <Volume2 size={20} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
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
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={theme.colors.gradient.primary}
                      style={styles.iconGradient}
                    >
                      <Vibrate size={20} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
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
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={theme.colors.gradient.primary}
                      style={styles.iconGradient}
                    >
                      <Clock size={20} color={theme.colors.text.primary} />
                    </LinearGradient>
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>Quotes Required</Text>
                    <Text style={styles.settingDescription}>
                      Number of quotes to swipe through
                    </Text>
                  </View>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={[styles.counterButton, commonStyles.filterButtonInactive]}
                    onPress={() => updateSetting('quotesRequired', Math.max(1, settings.quotesRequired - 1))}
                  >
                    <Minus size={16} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{settings.quotesRequired}</Text>
                  <TouchableOpacity
                    style={[styles.counterButton, commonStyles.filterButtonInactive]}
                    onPress={() => updateSetting('quotesRequired', Math.min(10, settings.quotesRequired + 1))}
                  >
                    <Plus size={16} color={theme.colors.text.secondary} />
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