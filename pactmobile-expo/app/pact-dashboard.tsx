
import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function PactDashboardPage() {
  const insets = useSafeAreaInsets();
  const { pact } = useLocalSearchParams();

  // Parse the pact object if it's passed as a string (which it often is in URL params)
  const currentPact = typeof pact === 'string' ? JSON.parse(pact) : pact;

  if (!currentPact) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Pact not found.</ThemedText>
      </ThemedView>
    );
  }

  const participants = currentPact.participants || [];
  const activeParticipants = participants.filter(p => p.status === 'active');
  const eliminatedParticipants = participants.filter(p => p.status === 'eliminated');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>{currentPact.name}</ThemedText>
        <ThemedText style={styles.description}>{currentPact.description}</ThemedText>

        <View style={styles.detailsContainer}>
          <ThemedText style={styles.detail}>Creator: {currentPact.creator}</ThemedText>
          <ThemedText style={styles.detail}>Status: {currentPact.status}</ThemedText>
          <ThemedText style={styles.detail}>Stake: ${currentPact.stake}</ThemedText>
          <ThemedText style={styles.detail}>Prize Pool: ${currentPact.prize_pool}</ThemedText>
        </View>

        <View style={styles.participantsContainer}>
          <ThemedText type="subtitle" style={styles.participantsTitle}>Participants</ThemedText>
          <View style={styles.participantSection}>
            <ThemedText type="defaultSemiBold">Active ({activeParticipants.length})</ThemedText>
            {activeParticipants.map((p, index) => (
              <ThemedText key={index} style={styles.participantName}>{p.name}</ThemedText>
            ))}
          </View>

          {eliminatedParticipants.length > 0 && (
            <View style={styles.participantSection}>
              <ThemedText type="defaultSemiBold">Eliminated ({eliminatedParticipants.length})</ThemedText>
              {eliminatedParticipants.map((p, index) => (
                <ThemedText key={index} style={[styles.participantName, styles.eliminated]}>{p.name}</ThemedText>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: Colors.palette.darkBlue,
    borderRadius: 8,
    marginBottom: 24,
  },
  detail: {
    color: Colors.dark.text,
    marginBottom: 8,
  },
  participantsContainer: {
    backgroundColor: Colors.palette.darkBlue,
    borderRadius: 8,
    padding: 16,
  },
  participantsTitle: {
    marginBottom: 16,
  },
  participantSection: {
    marginBottom: 12,
  },
  participantName: {
    marginLeft: 8,
    marginTop: 4,
  },
  eliminated: {
    textDecorationLine: 'line-through',
    color: Colors.dark.icon,
  },
});
