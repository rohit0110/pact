import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { stakeInPact, startChallengePact, fetchPactByPubkey } from '@/services/api/pactService';
import { PublicKey } from '@solana/web3.js';

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
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Pact not found.</ThemedText>
      </ThemedView>
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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {hasStaked ? (
        <View style={[styles.stakedContainer]}>
          <ThemedText style={styles.stakedText}>Staked</ThemedText>
        </View>
      ) : (
        <View style={styles.notStakedContainer}>
          <ThemedText style={styles.notStakedText}>Not Staked Yet</ThemedText>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
      {isCreator && currentPact.status === 'Initialized' && (
        <View style={styles.buttonContainer}>
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
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  copyText: {
    color: Colors.dark.tint,
    marginLeft: 8,
    fontSize: 12,
  },
  notStakedContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.palette.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  stakedContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.palette.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  stakedText: {
    color: Colors.palette.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stakeButton: {
    backgroundColor: Colors.palette.teal,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  stakeButtonText: {
    color: Colors.palette.white,
    fontWeight: 'bold',
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
  buttonContainer: {
    padding: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.dark.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.dark.icon,
  },
  buttonText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
});