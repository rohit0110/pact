import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { stakeInPact, startChallengePact, fetchPactByPubkey } from '@/services/api/pactService';
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';

export default function PactDashboardPage() {
  const insets = useSafeAreaInsets();
  const { pact: pactString } = useLocalSearchParams();
  const { wallets } = useEmbeddedSolanaWallet();
  const userPublicKey = wallets?.[0]?.address;

  const [currentPact, setCurrentPact] = useState(() => {
    return typeof pactString === 'string' ? JSON.parse(pactString) : pactString;
  });

  useEffect(() => {
    if (typeof pactString === 'string') {
      setCurrentPact(JSON.parse(pactString));
    }
  }, [pactString]);

  if (!currentPact) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{paddingTop: insets.top}}>
          <ThemedText>Pact not found.</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  const participants = currentPact.participants || [];
  const activeParticipants = participants.filter(p => p.is_eliminated === 0);
  const eliminatedParticipants = participants.filter(p => p.is_eliminated === 1);

  const currentUserParticipant = participants.find(p => p.pubkey === userPublicKey);
  const hasStaked = currentUserParticipant ? currentUserParticipant.has_staked === 1 : false;

  const isCreator = userPublicKey && currentPact.creator === userPublicKey;
  const allStaked = participants.every(p => p.has_staked === 1);

  const handleStake = async () => {
    const wallet = wallets?.[0];
    const provider = await wallet?.getProvider();
    if (!userPublicKey || !provider) {
      console.error("User public key or provider not found.");
      return;
    }
    try {
      await stakeInPact(
        new PublicKey(currentPact.pubkey),
        new PublicKey(userPublicKey),
        provider,
        currentPact.stake_amount
      );
      console.log("Staked successfully");
      const updatedPact = await fetchPactByPubkey(currentPact.pubkey);
      setCurrentPact(updatedPact);
    } catch (error) {
      console.error("Failed to stake:", error);
    }
  };

  const handleStartPact = async () => {
    const wallet = wallets?.[0];
    const provider = await wallet?.getProvider();
    if (!userPublicKey || !provider) {
      console.error("User public key or provider not found.");
      return;
    }
    try {
      await startChallengePact(new PublicKey(currentPact.pubkey), new PublicKey(userPublicKey), provider, participants);
      console.log("Pact started successfully");
      // TODO: Add logic to refresh the pact data to reflect the new state
    } catch (error) {
      console.error("Failed to start pact:", error);
    }
  };

  const handleCopyJoinCode = () => {
    if (currentPact.code) {
      Clipboard.setString(currentPact.code);
      Alert.alert('Copied', 'Pact join code copied to clipboard!');
    }
  };

  return (
    <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + DesignSystem.spacing.md,
          paddingBottom: insets.bottom + DesignSystem.spacing.md,
          paddingHorizontal: DesignSystem.spacing.md,
        }}
      >
        <ThemedText type="title" style={styles.title}>{currentPact.name}</ThemedText>
        <ThemedText style={styles.description}>{currentPact.description}</ThemedText>

        <View style={styles.detailsContainer}>
          <ThemedText style={styles.detail}>Creator: {currentPact.creator}</ThemedText>
          <ThemedText style={styles.detail}>Status: {currentPact.status}</ThemedText>
          <ThemedText style={styles.detail}>Stake: ${currentPact.stake_amount}</ThemedText>
          <ThemedText style={styles.detail}>Prize Pool: ${currentPact.prize_pool}</ThemedText>
          {currentPact.code && (
            <TouchableOpacity onPress={handleCopyJoinCode} style={styles.joinCodeContainer}>
              <ThemedText style={styles.detail}>
                Join Code: {currentPact.code}
              </ThemedText>
              <ThemedText style={styles.copyText}>(tap to copy)</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {!hasStaked && (
          <TouchableOpacity style={styles.stakeButton} onPress={handleStake}>
            <ThemedText style={styles.stakeButtonText}>Stake</ThemedText>
          </TouchableOpacity>
        )}

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
      </ScrollView>

      {hasStaked ? (
        <View style={[styles.stakedContainer, { top: insets.top + DesignSystem.spacing.sm }]}>
          <ThemedText style={styles.stakedText}>Staked</ThemedText>
        </View>
      ) : (
        <View style={[styles.notStakedContainer, { top: insets.top + DesignSystem.spacing.sm }]}>
          <ThemedText style={styles.notStakedText}>Not Staked Yet</ThemedText>
        </View>
      )}

      {isCreator && currentPact.status === 'Initialized' && (
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + DesignSystem.spacing.sm }]}>
          {participants.length < 2 && (
            <ThemedText style={styles.errorText}>
              Not enough members to start
            </ThemedText>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              (!allStaked || participants.length < 2) && styles.disabledButton,
            ]}
            disabled={!allStaked || participants.length < 2}
            onPress={handleStartPact}
          >
            <ThemedText style={styles.buttonText}>Start Pact</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.sm,
  },
  copyText: {
    color: DesignSystem.colors.neonMintVibrant,
    marginLeft: DesignSystem.spacing.sm,
    fontSize: 12,
  },
  notStakedContainer: {
    position: 'absolute',
    right: DesignSystem.spacing.md,
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.sm,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  notStakedText: {
    color: '#ff8a80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stakedContainer: {
    position: 'absolute',
    right: DesignSystem.spacing.md,
    backgroundColor: 'rgba(0, 255, 159, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.sm,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 159, 0.5)',
  },
  stakedText: {
    color: DesignSystem.colors.neonMintVibrant,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stakeButton: {
    backgroundColor: DesignSystem.colors.neonMint,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  stakeButtonText: {
    color: DesignSystem.colors.charcoalBlack,
    fontWeight: 'bold',
  },
  participantsContainer: {
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(141, 255, 240, 0.2)',
    marginBottom: 80, // Ensure space for the button
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: 'transparent',
    paddingTop: DesignSystem.spacing.sm,
  },
  button: {
    backgroundColor: DesignSystem.colors.neonMint,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: DesignSystem.colors.slateGreyBlue,
  },
  buttonText: {
    color: DesignSystem.colors.charcoalBlack,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
});