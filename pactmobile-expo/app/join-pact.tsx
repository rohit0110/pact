import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { fetchPactViaJoinCode, joinPact } from '../services/api/pactService';
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';

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
    const isUserInPact = userPublicKey && participants.some(p => p.pubkey === userPublicKey);

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
        {isUserInPact ? (
          <ThemedText style={styles.alreadyInPactText}>You are already in this pact.</ThemedText>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleJoinPact}>
              <ThemedText style={styles.buttonText}>Join Pact</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={DesignSystem.gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      {!pact ? (
        <View style={styles.content}>
          <ThemedText type="title">Join a Pact</ThemedText>
          <ThemedText style={styles.label}>Enter Pact Code:</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Pact Code"
            placeholderTextColor={DesignSystem.colors.icyAqua}
            value={pactCode}
            onChangeText={setPactCode}
          />
          {loading ? (
            <ActivityIndicator size="large" color={DesignSystem.colors.neonMintVibrant} />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: DesignSystem.spacing.md,
    },
    label: {
        marginTop: DesignSystem.spacing.md,
        marginBottom: DesignSystem.spacing.sm,
        color: DesignSystem.colors.icyAquaLight,
    },
    input: {
        backgroundColor: 'rgba(197, 255, 248, 0.1)',
        color: DesignSystem.colors.white,
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: DesignSystem.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(141, 255, 240, 0.2)',
    },
    button: {
        backgroundColor: DesignSystem.colors.neonMint,
        padding: DesignSystem.spacing.md,
        borderRadius: DesignSystem.borderRadius.md,
        alignItems: 'center',
        marginTop: DesignSystem.spacing.md,
    },
    buttonText: {
        color: DesignSystem.colors.charcoalBlack,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
    scrollContent: {
        padding: DesignSystem.spacing.md,
    },
    title: {
        marginBottom: DesignSystem.spacing.sm,
        color: DesignSystem.colors.white,
    },
    description: {
        marginBottom: DesignSystem.spacing.md,
        color: DesignSystem.colors.icyAquaLight,
    },
    detailsContainer: {
        padding: DesignSystem.spacing.md,
        backgroundColor: 'rgba(197, 255, 248, 0.1)',
        borderRadius: DesignSystem.borderRadius.lg,
        marginBottom: DesignSystem.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(141, 255, 240, 0.2)',
    },
    detail: {
        color: DesignSystem.colors.icyAquaLight,
        marginBottom: DesignSystem.spacing.sm,
    },
    participantsContainer: {
        backgroundColor: 'rgba(197, 255, 248, 0.1)',
        borderRadius: DesignSystem.borderRadius.lg,
        padding: DesignSystem.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(141, 255, 240, 0.2)',
    },
    participantsTitle: {
        marginBottom: DesignSystem.spacing.md,
        color: DesignSystem.colors.white,
    },
    participantSection: {
        marginBottom: DesignSystem.spacing.sm,
    },
    participantName: {
        marginLeft: DesignSystem.spacing.sm,
        marginTop: DesignSystem.spacing.xs,
        color: DesignSystem.colors.icyAquaLight,
    },
    eliminated: {
        textDecorationLine: 'line-through',
        color: DesignSystem.colors.icyAqua,
    },
    alreadyInPactText: {
        textAlign: 'center',
        color: DesignSystem.colors.neonMintVibrant,
        marginTop: 20,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
