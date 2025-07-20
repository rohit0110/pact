
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

// Dummy Pact Data (replace with actual data fetching later)
const DUMMY_PACT = {
  pubkey: 'pact123',
  name: 'Morning Workout Challenge',
  description: 'Complete a 30-minute workout every morning for 30 days.',
  status: 'Active',
  prize_pool: 500, // USD or SOL
  stake_amount: 20, // USD or SOL
  duration_days: 30,
  participants: [
    { id: 'user1', name: 'Alice' },
    { id: 'user2', name: 'Bob' },
    { id: 'user3', name: 'Charlie' },
  ],
  created_at: Date.now(),
};

const PactDashboardScreen = () => {
  const pact = DUMMY_PACT; // In a real app, this would come from navigation params or a state management solution

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.pactName}>{pact.name}</Text>
        <Text style={styles.description}>{pact.description}</Text>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, styles[`status${pact.status}`]]}>{pact.status}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Prize Pool:</Text>
          <Text style={styles.detailValue}>${pact.prize_pool}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Your Stake:</Text>
          <Text style={styles.detailValue}>${pact.stake_amount}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{pact.duration_days} days</Text>
        </View>

        <View style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {pact.participants.map((participant) => (
            <Text key={participant.id} style={styles.participantName}>- {participant.name}</Text>
          ))}
        </View>

        {/* Add more details or actions here */}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    padding: 20,
    paddingTop: 40, // Added padding to account for notch/camera area
  },
  pactName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 20,
    lineHeight: 22,
  },
  detailCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#8e8e93',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statusActive: {
    color: '#34c759', // Green for active
  },
  statusInitialized: {
    color: '#ff9500', // Orange for initialized
  },
  statusCompleted: {
    color: '#007aff', // Blue for completed
  },
  statusCancelled: {
    color: '#ff3b30', // Red for cancelled
  },
  participantsCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
});

export default PactDashboardScreen;
