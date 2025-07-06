import { Tabs } from 'expo-router';
import { Clock, Quote, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/constants/theme';
import MaskedView from '@react-native-masked-view/masked-view';
import { GradientText } from '@/components/GradientText';

// Custom gradient icon component
function GradientIcon({ IconComponent, size, focused }: { 
  IconComponent: any, 
  size: number, 
  focused: boolean 
}) {
  if (!focused) {
    return <IconComponent size={size} color={theme.colors.text.secondary} />;
  }

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={
        <View style={{ backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
          <IconComponent size={size} color="black" />
        </View>
      }
    >
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={{ width: size, height: size }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </MaskedView>
  );
}

// Custom gradient label component
function GradientLabel({ label, focused }: { label: string, focused: boolean }) {
  if (!focused) {
    return (
      <Text style={{
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 4,
      }}>
        {label}
      </Text>
    );
  }

  return (
    <GradientText style={{
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.xs,
      marginTop: 4,
    }}>
      {label}
    </GradientText>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.gradient.primary[1], // Use the blue from our gradient
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            {/* Solid opaque background */}
            <View style={styles.solidBackground} />
          </View>
        ),
        tabBarLabelStyle: {
          display: 'none', // Hide default labels, we'll use custom ones
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alarms',
          tabBarIcon: ({ size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <GradientIcon IconComponent={Clock} size={size} focused={focused} />
              <GradientLabel label="Alarms" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <GradientIcon IconComponent={Quote} size={size} focused={focused} />
              <GradientLabel label="Quotes" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <GradientIcon IconComponent={Settings} size={size} focused={focused} />
              <GradientLabel label="Settings" focused={focused} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingBottom: 30,
    paddingTop: 10,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: theme.colors.background, // Solid opaque background
  },
  tabBarBackground: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  solidBackground: {
    flex: 1,
    backgroundColor: theme.colors.background, // Solid dark background
  },
});