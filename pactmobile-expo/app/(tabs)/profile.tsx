
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';

export default function ProfilePage() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} style={styles.profileImage} />
        <ThemedText type="title">John Doe</ThemedText>
        <ThemedText type="subtitle">@johndoe</ThemedText>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>12</ThemedText>
          <ThemedText style={styles.statLabel}>Pacts Created</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>8</ThemedText>
          <ThemedText style={styles.statLabel}>Pacts Completed</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText style={styles.statNumber}>4</ThemedText>
          <ThemedText style={styles.statLabel}>Pacts in Progress</ThemedText>
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
