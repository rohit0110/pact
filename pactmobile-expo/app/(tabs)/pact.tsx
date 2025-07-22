
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { fetchPacts, fetchAllPacts } from '../../services/api/pactService';

export default function PactPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  type PactType = {
    id: string;
    name: string;
    description: string;
    status: string;
    prizePool: number;
    title: string;
    prize_pool: number;
    participants?: { name: string; status: string }[];
  };

  const [pacts, setPacts] = useState<PactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Placeholder pubkey for now
  const pubkey = 'YOUR_PLACEHOLDER_PUBKEY'; 

  useEffect(() => {
    const loadPacts = async () => {
      try {
        const data = await fetchAllPacts();
        type PactApiType = {
          id: string;
          name: string;
          description?: string;
          status: string;
          prize_pool: number;
          [key: string]: any;
        };

        const formatted = (data as PactApiType[]).map((pact: PactApiType) => ({
          ...pact,
          prizePool: pact.prize_pool,
          status: pact.status.charAt(0).toUpperCase() + pact.status.slice(1), // Capitalize status
          title: pact.name,
          description: pact.description || 'No description available',
          id: pact.id,
          participants: pact.participants || [], // Ensure participants is always an array
        }));
        setPacts(formatted);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        console.error("Failed to load pacts:", e);
      } finally {
        setLoading(false);
      }
    };

    loadPacts();
  }, [pubkey]);

  const renderItem = ({ item }: { item: { id: string; title: string; description: string; status: string; prizePool: number } }) => (
    <TouchableOpacity onPress={() => router.push({ pathname: '/pact-dashboard', params: { pact: JSON.stringify(item) } })}>
      <View style={styles.pactContainer}>
        <View style={styles.pactHeader}>
          <ThemedText type="subtitle" style={styles.pactTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.pactStatus}>{item.status}</ThemedText>
        </View>
        <ThemedText style={styles.pactDescription}>{item.description}</ThemedText>
        <ThemedText style={styles.prizePool}>${item.prizePool}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Error: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={pacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Your Pacts</ThemedText>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-pact')}>
        <IconSymbol name="plus" size={28} color={Colors.dark.background} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  pactContainer: {
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.palette.darkBlue,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.palette.lightBlue,
  },
  pactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pactTitle: {
    fontWeight: 'bold',
  },
  pactStatus: {
    fontStyle: 'italic',
  },
  pactDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  prizePool: {
    textAlign: 'right',
    fontWeight: 'bold',
    color: Colors.dark.tint,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: Colors.dark.tint,
    borderRadius: 28,
    elevation: 8,
  },
});
