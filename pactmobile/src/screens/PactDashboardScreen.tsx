
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

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
    { id: 'user1', name: 'Alice', isEliminated: false },
    { id: 'user2', name: 'Bob', isEliminated: true },
    { id: 'user3', name: 'Charlie', isEliminated: false },
    { id: 'user4', name: 'David', isEliminated: true },
    { id: 'user5', name: 'Dave', isEliminated: false },
  ],
  created_at: Date.now(),
};

const PactDashboardScreen = () => {
  const pact = DUMMY_PACT; // In a real app, this would come from navigation params or a state management solution
  const [activeTab, setActiveTab] = useState<'inRunning' | 'eliminated'>('inRunning');

  const inRunningParticipants = pact.participants.filter(p => !p.isEliminated);
  const eliminatedParticipants = pact.participants.filter(p => p.isEliminated);

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
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'inRunning' && styles.activeTab]}
              onPress={() => setActiveTab('inRunning')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'inRunning' && styles.activeTabText]}>In Running ({inRunningParticipants.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'eliminated' && styles.activeTab]}
              onPress={() => setActiveTab('eliminated')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'eliminated' && styles.activeTabText]}>Eliminated ({eliminatedParticipants.length})</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'inRunning' ? (
            <View>
              {inRunningParticipants.length > 0 ? (
                inRunningParticipants.map((participant) => (
                  <Text key={participant.id} style={styles.participantName}>- {participant.name}</Text>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No participants currently in running.</Text>
              )}
            </View>
          ) : (
            <View>
              {eliminatedParticipants.length > 0 ? (
                eliminatedParticipants.map((participant) => (
                  <Text key={participant.id} style={[styles.participantName, styles.eliminatedParticipantName]}>- {participant.name}</Text>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No eliminated participants.</Text>
              )}
            </View>
          )}
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
  eliminatedParticipantName: {
    color: '#8e8e93',
    textDecorationLine: 'line-through',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  activeTab: {
    backgroundColor: '#007aff',
  },
  tabButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  noParticipantsText: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PactDashboardScreen;
