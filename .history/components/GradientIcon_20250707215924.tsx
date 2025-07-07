import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '@/constants/theme';
import { LucideIcon } from 'lucide-react-native';

interface GradientIconProps {
  icon: LucideIcon;
  size?: number;
  colors?: readonly string[];
}

export function GradientIcon({ 
  icon: Icon, 
  size = 20, 
  colors = theme.colors.gradient.primary 
}: GradientIconProps) {
  return (
    <MaskedView
      maskElement={
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={size} color="white" />
        </View>
      }
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: size, width: size }}
      >
        <Icon size={size} color="transparent" />
      </LinearGradient>
    </MaskedView>
  );
}
