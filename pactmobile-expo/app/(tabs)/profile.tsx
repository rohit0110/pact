
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';

const dummyProfile = {
  name: 'John Doe',
  active_pacts: 4,
  pacts_won: 8,
  pacts_lost: 2,
};

export default function ProfilePage() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} style={styles.profileImage} />
        <ThemedText type="title">{dummyProfile.name}</ThemedText>
        <ThemedText type="subtitle">@johndoe</ThemedText>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>{dummyProfile.active_pacts}</ThemedText>
          <ThemedText style={styles.statLabel}>Active Pacts</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>{dummyProfile.pacts_won}</ThemedText>
          <ThemedText style={styles.statLabel}>Pacts Won</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>{dummyProfile.pacts_lost}</ThemedText>
          <ThemedText style={styles.statLabel}>Pacts Lost</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.icon,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.tint,
  },
  statLabel: {
    marginTop: 4,
    color: Colors.dark.icon,
  },
});
