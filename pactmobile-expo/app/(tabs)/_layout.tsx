import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';

function FloatingActionButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/create-pact')} style={styles.fabContainer}>
      <LinearGradient
        colors={DesignSystem.gradients.fab}
        style={styles.fab}
      >
        <IconSymbol name="plus" size={32} color={DesignSystem.colors.charcoalBlack} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: DesignSystem.colors.neonMintVibrant,
          tabBarInactiveTintColor: DesignSystem.colors.icyAqua,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 1,
            borderTopColor: 'rgba(141, 255, 240, 0.2)',
            backgroundColor: 'rgba(14, 21, 26, 0.8)', // Semi-transparent slate-grey-blue
            height: 80,
          },
        }}>
        <Tabs.Screen
          name="pact"
          options={{
            title: 'Pacts',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name="figure.walk" color={color} style={focused ? styles.focusedIcon : {}} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={28} name="person.fill" color={color} style={focused ? styles.focusedIcon : {}} />
            ),
          }}
        />
      </Tabs>
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 50, // Adjust to be above the tab bar
    alignSelf: 'center',
    zIndex: 10,
    shadowColor: DesignSystem.colors.neonMintVibrant,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedIcon: {
    shadowColor: DesignSystem.colors.neonMintVibrant,
    shadowRadius: 10,
    shadowOpacity: 1,
  },
});
