import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GradientIcon } from './GradientIcon';
import { LucideIcon } from 'lucide-react-native';

interface IconWithLabelProps {
  icon: LucideIcon;
  size?: number;
  children: React.ReactNode;
}

export function IconWithLabel({ icon, size = 20, children }: IconWithLabelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <GradientIcon icon={icon} size={size} />
      </View>
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from center to flex-start
  },
  iconWrapper: {
    paddingTop: 2, // Add a small top padding to align with the first line of text
  },
  childrenContainer: {
    marginLeft: 8,
    flex: 1,
  }
});
