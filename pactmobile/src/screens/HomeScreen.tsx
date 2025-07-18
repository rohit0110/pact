import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { getPacts } from '../services/api'; // Import the API service
import { Pact } from '../types'; // Import the Pact type

// Dummy data for pacts, used for initial state
const DUMMY_PACTS: Pact[] = [
  {
    pubkey: '1',
    name: 'Morning Run Club',
    description: 'Run 5km every day before 8 AM.',
    status: 'Active',
    prize_pool: 150,
    stake_amount: 10,
    created_at: 0,
  },
  {
    pubkey: '2',
    name: 'Daily Coding Challenge',
    description: 'Solve one LeetCode problem daily.',
    status: 'Active',
    prize_pool: 250,
    stake_amount: 10,
    created_at: 0,
  },
  {
    pubkey: '3',
    name: 'Digital Detox',
    description: 'Less than 2 hours of screen time per day.',
    status: 'Initialized',
    prize_pool: 100,
    stake_amount: 10,
    created_at: 0,
  },
];

const PactCard = ({ pact, onPress }: { pact: Pact, onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.pactName}>{pact.name}</Text>
      <Text style={[styles.status, styles[`status${pact.status}`]]}>{pact.status}</Text>
    </View>
    <Text style={styles.description}>{pact.description}</Text>
    <Text style={styles.prizePool}>Prize Pool: {pact.prize_pool} SOL</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  const [pacts, setPacts] = useState(DUMMY_PACTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPacts = async () => {
      setLoading(true);
      // const fetchedPacts = await getPacts();
      // setPacts(fetchedPacts);
      setLoading(false);
    };

    fetchPacts();
  }, []);

  const renderItem = ({ item }: { item: Pact }) => (
    <PactCard 
      pact={item} 
      onPress={() => navigation.navigate('PactDashboard', { pactId: item.pubkey })} 
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pacts}
        renderItem={renderItem}
        keyExtractor={item => item.pubkey}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
            <View style={styles.center}>
                <Text style={styles.description}>No pacts found.</Text>
            </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pactName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  statusActive: {
    backgroundColor: '#007aff', // Blue
  },
  statusInitialized: {
    backgroundColor: '#ff9500', // Orange
  },
  statusCompleted: {
    backgroundColor: '#34c759', // Green
  },
  statusCancelled: {
    backgroundColor: '#ff3b30', // Red
  },
  description: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 12,
  },
  prizePool: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default HomeScreen;
