import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { fetchPactViaJoinCode, joinPact } from '../services/api/pactService';
import { PublicKey } from '@solana/web3.js';

export default function JoinPactPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const userPublicKey = wallet?.address;

  const [pactCode, setPactCode] = useState('');
  const [pact, setPact] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchPact = async () => {
    if (!pactCode) {
      setError("Please enter a pact code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const pactData = await fetchPactViaJoinCode(pactCode);
      setPact(pactData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch pact.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPact = async () => {
    if (!pact || !wallet || !userPublicKey) {
        setError("Cannot join pact. Wallet not connected or pact data missing.");
        return;
    }
    setLoading(true);
    try {
        const provider = await wallet.getProvider();
        await joinPact(new PublicKey(pact.pubkey), new PublicKey(userPublicKey), provider);
        router.push('/(tabs)/pact');
    } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to join pact.");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const renderPactDetails = () => {
    if (!pact) return null;

    const participants = pact.participants || [];
    const activeParticipants = participants.filter(p => p.is_eliminated === 0);
    const eliminatedParticipants = participants.filter(p => p.is_eliminated === 1);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>{pact.name}</ThemedText>
        <ThemedText style={styles.description}>{pact.description}</ThemedText>

        <View style={styles.detailsContainer}>
          <ThemedText style={styles.detail}>Creator: {pact.creator}</ThemedText>
          <ThemedText style={styles.detail}>Status: {pact.status}</ThemedText>
          <ThemedText style={styles.detail}>Stake: ${pact.stake_amount}</ThemedText>
          <ThemedText style={styles.detail}>Prize Pool: ${pact.prize_pool}</ThemedText>
        </View>

        <View style={styles.participantsContainer}>
          <ThemedText type="subtitle" style={styles.participantsTitle}>Participants</ThemedText>
          <View style={styles.participantSection}>
            <ThemedText type="defaultSemiBold">Active ({activeParticipants.length})</ThemedText>
            {activeParticipants.map((p, index) => (
              <ThemedText key={index} style={styles.participantName}>{p.pubkey}</ThemedText>
            ))}
          </View>

          {eliminatedParticipants.length > 0 && (
            <View style={styles.participantSection}>
              <ThemedText type="defaultSemiBold">Eliminated ({eliminatedParticipants.length})</ThemedText>
              {eliminatedParticipants.map((p, index) => (
                <ThemedText key={index} style={[styles.participantName, styles.eliminated]}>{p.pubkey}</ThemedText>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleJoinPact}>
            <ThemedText style={styles.buttonText}>Join Pact</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {!pact ? (
        <View style={styles.content}>
          <ThemedText type="title">Join a Pact</ThemedText>
          <ThemedText style={styles.label}>Enter Pact Code:</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Pact Code"
            placeholderTextColor={Colors.dark.icon}
            value={pactCode}
            onChangeText={setPactCode}
          />
          {loading ? (
            <ActivityIndicator size="large" color={Colors.dark.tint} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleFetchPact}>
              <ThemedText style={styles.buttonText}>Find Pact</ThemedText>
            </TouchableOpacity>
          )}
          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        </View>
      ) : (
        renderPactDetails()
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    label: {
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.palette.darkBlue,
        color: Colors.dark.text,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.palette.lightBlue,
    },
    button: {
        backgroundColor: Colors.dark.tint,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: Colors.dark.background,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
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