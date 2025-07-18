import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';

// Dummy data for the user profile
const DUMMY_PROFILE = {
  name: 'Icarus',
  pactsWon: 5,
  pactsLost: 2,
};

// Dummy data for active pacts list
const DUMMY_ACTIVE_PACTS = [
  { id: '1', name: 'Morning Run Club' },
  { id: '2', name: 'Daily Coding Challenge' },
];

type Pact = {
  id: string;
  name: string;
};

const ProfileScreen = () => {
  const renderPactItem = ({ item }: { item: Pact }) => (
    <View style={styles.pactItem}>
      <Text style={styles.pactItemText}>{item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{DUMMY_PROFILE.name.charAt(0)}</Text>
        </View>
        <Text style={styles.profileName}>{DUMMY_PROFILE.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{DUMMY_PROFILE.pactsWon}</Text>
          <Text style={styles.statLabel}>Pacts Won</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{DUMMY_PROFILE.pactsLost}</Text>
          <Text style={styles.statLabel}>Pacts Lost</Text>
        </View>
      </View>

      <View style={styles.activePactsSection}>
        <Text style={styles.sectionTitle}>Active Pacts</Text>
        <FlatList
          data={DUMMY_ACTIVE_PACTS}
          renderItem={renderPactItem}
          keyExtractor={item => item.id}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 4,
  },
  activePactsSection: {
    width: '90%',
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pactItem: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  pactItemText: {
    color: '#fff',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#1c1c1e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 40,
  },
  signOutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;