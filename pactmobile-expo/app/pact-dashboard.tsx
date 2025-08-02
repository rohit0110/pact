import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Clipboard, Alert, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { stakeInPact, startChallengePact, fetchPactByPubkey, fetchPlayerProfile } from '@/services/api/pactService';
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPieChart from '@/components/PieChart';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BlurView } from 'expo-blur';

const { height: screenHeight } = Dimensions.get('window');

export default function PactDashboardPage() {
  const insets = useSafeAreaInsets();
  const { pact: pactString } = useLocalSearchParams();
  const { wallets } = useEmbeddedSolanaWallet();
  const userPublicKey = wallets?.[0]?.address;

  const [currentPact, setCurrentPact] = useState(() => {
    return typeof pactString === 'string' ? JSON.parse(pactString) : pactString;
  });
  const [participantNames, setParticipantNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (typeof pactString === 'string') {
      setCurrentPact(JSON.parse(pactString));
    }
  }, [pactString]);

  useEffect(() => {
    const loadParticipantNames = async () => {
      if (currentPact && currentPact.participants) {
        const names: { [key: string]: string } = {};
        for (const p of currentPact.participants) {
          try {
            const profile = await fetchPlayerProfile(p.pubkey);
            names[p.pubkey] = profile.name || p.pubkey.substring(0, 6) + '...' + p.pubkey.substring(p.pubkey.length - 6);
          } catch (error) {
            console.error("Failed to fetch profile for participant", p.pubkey, error);
            names[p.pubkey] = p.pubkey.substring(0, 6) + '...' + p.pubkey.substring(p.pubkey.length - 6); // Fallback to truncated pubkey
          }
        }
        setParticipantNames(names);
      }
    };
    loadParticipantNames();
  }, [currentPact]);

  if (!currentPact) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Pact not found.</ThemedText>
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
      console.error("Failed to Start Pact", error);
    }
  };

  const handleCopyJoinCode = () => {
    if (currentPact.code) {
      Clipboard.setString(currentPact.code);
      Alert.alert('Copied', 'Pact join code copied to clipboard!');
    }
  };

  const getDisabledReason = () => {
    if (participants.length < 2) return "Not enough members to start";
    if (!allStaked) return "Waiting for all members to stake";
    return "";
  };

  const renderBottomButtons = () => {
    const disabledReason = getDisabledReason();
    if (!hasStaked) {
      if (isCreator) {
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={handleStake}>
              <ThemedText style={styles.buttonText}>Stake</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.halfButton, !!disabledReason && styles.disabledButton]}
              disabled={!!disabledReason}
              onPress={handleStartPact}
            >
              <ThemedText style={styles.buttonText}>Start Pact</ThemedText>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <TouchableOpacity style={styles.button} onPress={handleStake}>
          <ThemedText style={styles.buttonText}>Stake</ThemedText>
        </TouchableOpacity>
      );
    }
    if (isCreator && currentPact.status === 'Initialized') {
      return (
        <View>
          <TouchableOpacity
            style={[styles.button, !!disabledReason && styles.disabledButton]}
            disabled={!!disabledReason}
            onPress={handleStartPact}
          >
            <ThemedText style={[styles.buttonText, !!disabledReason && { color: 'red' }]}>{disabledReason || "Start Pact"}</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const topCardHeight = screenHeight * 0.25;
  const sheetHeight = screenHeight - topCardHeight - insets.top;

  return (
    <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
      <View style={[styles.pactSummaryCard, { height: topCardHeight, paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#00B49F', '#0AC9C4', '#75E5DC']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={styles.pactSummaryGradient}
        >
          <View style={styles.pactSummaryLeft}>
            <ThemedText type="title" style={styles.pactSummaryTitle}>{currentPact.name}</ThemedText>

              <ThemedText style={styles.statusText}>{currentPact.status}</ThemedText>

            <ThemedText style={styles.pactSummaryDescription}>{currentPact.description}</ThemedText>
            {currentPact.code && (
              <View style={styles.joinCodeRow}>
                <TouchableOpacity onPress={handleCopyJoinCode} style={styles.joinCodeContainer}>
                  <ThemedText style={[styles.detail, { textDecorationLine: 'underline' }]}>
                    Join Code: {currentPact.code}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.pactSummaryRight}>
            <ThemedText style={styles.prizePoolAmount}>{currentPact.prize_pool}</ThemedText>
            <ThemedText style={styles.prizePoolLabel}>Prize Pool</ThemedText>
          </View>
        </LinearGradient>
      </View>

      <View style={[styles.sheetContainer, { height: sheetHeight, top: topCardHeight + insets.top }]}>
        <BlurView intensity={50} tint="dark" style={styles.sheet}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: DesignSystem.spacing.md,
              paddingBottom: insets.bottom + 120, // Space for the button
            }}
          >
            <View style={styles.goalCard}>
              <IconSymbol name="logo.github" size={24} color={DesignSystem.colors.white} />
              <ThemedText style={styles.goalText}>{currentPact.goal_value} {currentPact.goal_type}</ThemedText>
            </View>

            <View style={styles.chartContainer}>
              <AnimatedPieChart active={activeParticipants.length} total={participants.length}>
                <ThemedText style={styles.chartLabel}>{`${activeParticipants.length} Active`}</ThemedText>
                <ThemedText style={styles.chartSubLabel}>{`/ ${participants.length} Total`}</ThemedText>
              </AnimatedPieChart>
            </View>

            <View style={styles.participantsListContainer}>
              <ThemedText type="subtitle" style={styles.participantsTitle}>Active Participants</ThemedText>
              {activeParticipants.map((p, index) => (
                <View key={index} style={styles.participantCard}>
                  <ThemedText style={styles.participantName} numberOfLines={1}>{participantNames[p.pubkey] || p.pubkey}</ThemedText>
                  <View style={styles.participantStatus}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={DesignSystem.colors.neonMintVibrant} />
                    <ThemedText style={styles.participantStatusText}>Staked</ThemedText>
                  </View>
                </View>
              ))}
            </View>

            {eliminatedParticipants.length > 0 && (
              <View style={styles.participantsListContainer}>
                <ThemedText type="subtitle" style={styles.participantsTitle}>Eliminated Participants</ThemedText>
                {eliminatedParticipants.map((p, index) => (
                  <View key={index} style={[styles.participantCard, styles.eliminatedCard]}>
                    <ThemedText style={styles.participantName} numberOfLines={1}>{participantNames[p.pubkey] || p.pubkey}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + DesignSystem.spacing.sm }]}>
            {renderBottomButtons()}
          </View>
        </BlurView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pactSummaryCard: {
    marginTop: '5%',
    width: '90%',
    alignSelf: 'center',
    borderRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  pactSummaryGradient: {
    flex: 1,
    borderRadius: DesignSystem.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: 'rgba(15,15,15,0,85)'
  },
  pactSummaryLeft: {
    flex: 2,
    justifyContent: 'center',
  },
  pactSummaryRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pactSummaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DesignSystem.colors.white,
    marginBottom: DesignSystem.spacing.xs,
  },
  pactSummaryDescription: {
    fontSize: 14,
    color: DesignSystem.colors.icyAquaLight,
    marginBottom: DesignSystem.spacing.sm,
  },
  prizePoolAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: DesignSystem.colors.white,
  },
  prizePoolLabel: {
    fontSize: 14,
    color: DesignSystem.colors.icyAqua,
  },
  sheetContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: DesignSystem.borderRadius.lg,
    borderTopRightRadius: DesignSystem.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  pactInfoContainer: {
    paddingTop: DesignSystem.spacing.lg,
    marginBottom: DesignSystem.spacing.lg,
  },
  pactNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
  },
  title: {
    color: DesignSystem.colors.white,
    marginRight: DesignSystem.spacing.sm,
  },
  statusText: {
    color: DesignSystem.colors.charcoalBlack,
    fontWeight: 'bold',
    fontSize: 12,
  },
  description: {
    marginBottom: DesignSystem.spacing.md,
    color: DesignSystem.colors.icyAquaLight,
  },
  goalCard: {
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  goalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignSystem.colors.white,
    marginLeft: DesignSystem.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  chartLabel: {
    color: DesignSystem.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartSubLabel: {
    color: DesignSystem.colors.icyAqua,
    fontSize: 14,
    textAlign: 'center',
  },
  participantsListContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  participantsTitle: {
    color: DesignSystem.colors.white,
    marginBottom: DesignSystem.spacing.md,
  },
  participantCard: {
    backgroundColor: 'rgba(15, 15, 15, 0.5)',
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eliminatedCard: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  participantName: {
    color: DesignSystem.colors.icyAquaLight,
    flex: 1,
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantStatusText: {
    color: DesignSystem.colors.neonMintVibrant,
    marginLeft: DesignSystem.spacing.sm,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DesignSystem.spacing.md,
    backgroundColor: 'transparent',
    paddingTop: DesignSystem.spacing.sm,
  },
  joinCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.sm,
    justifyContent: 'space-between',
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: DesignSystem.colors.neonMint,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    flex: 1,
  },
  halfButton: {
    marginHorizontal: DesignSystem.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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