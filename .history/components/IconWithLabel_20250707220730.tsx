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
      <GradientIcon icon={icon} size={size} />
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childrenContainer: {
    marginLeft: 8,
    flex: 1,
  }
});
