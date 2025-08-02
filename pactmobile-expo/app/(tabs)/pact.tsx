
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { DesignSystem } from '@/constants/DesignSystem';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { PublicKey } from '@solana/web3.js';
import { fetchPacts } from '../../services/api/pactService';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0] || null;
  const walletPublicKey = wallet?.address || null;

  const loadPacts = useCallback(async () => {
    if (!walletPublicKey) {
      setLoading(false);
      return;
    }
    try {
      const pubkey = new PublicKey(walletPublicKey);
      const data = await fetchPacts(pubkey.toString());
      type PactApiType = {
        id: string;
        name: string;
        description?: string;
        status: string;
        prize_pool: number;
        stake: number;
        [key: string]: any;
      };
      const formatted = (data as PactApiType[]).map((pact: PactApiType) => ({
        ...pact,
        prizePool: pact.prize_pool,
        status: pact.status.charAt(0).toUpperCase() + pact.status.slice(1),
        title: pact.name,
        description: pact.description || 'No description available',
        id: pact.id,
        stake: pact.stake_amount,
        participants: pact.participants || [],
      }));
      setPacts(formatted);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      console.error("Failed to load pacts:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [walletPublicKey]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPacts();
    }, [loadPacts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPacts();
  }, [loadPacts]);

  if (!wallet) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Please connect your wallet to view pacts.</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: PactType }) => (
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

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={DesignSystem.colors.neonMintVibrant} />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: DesignSystem.spacing.md }}>
          <ThemedText>Error: {error.message}</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DesignSystem.gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={pacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Your Pacts</ThemedText>
            <TouchableOpacity style={styles.joinButton} onPress={() => router.push('/join-pact')}>
              <ThemedText style={styles.joinButtonText}>Join Pact</ThemedText>
            </TouchableOpacity>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DesignSystem.colors.neonMintVibrant} />}
        contentContainerStyle={{ paddingBottom: 100 }} // Ensure space for FAB
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: DesignSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.icyAqua,
  },
  joinButtonText: {
    color: DesignSystem.colors.white,
    fontWeight: 'bold',
  },
  pactContainer: {
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.md,
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(141, 255, 240, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  pactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  pactTitle: {
    fontWeight: 'bold',
    color: DesignSystem.colors.white,
  },
  pactStatus: {
    fontStyle: 'italic',
    color: DesignSystem.colors.icyAqua,
  },
  pactDescription: {
    fontSize: 14,
    marginBottom: DesignSystem.spacing.sm,
    color: DesignSystem.colors.icyAquaLight,
  },
  prizePool: {
    textAlign: 'right',
    fontWeight: 'bold',
    color: DesignSystem.colors.neonMintVibrant,
  },
});
