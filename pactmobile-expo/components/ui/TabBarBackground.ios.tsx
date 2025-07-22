import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/Colors';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      tint="dark"
      intensity={100}
      style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.background }]}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
