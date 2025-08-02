import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Dimensions, Alert, Share, Clipboard } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { fetchPactViaJoinCode, joinPact, fetchPlayerProfile } from '../services/api/pactService';
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import PieChart from '@/components/PieChart';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { height: screenHeight } = Dimensions.get('window');

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
  const [participantNames, setParticipantNames] = useState<{ [key: string]: string }>({});

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

      const names: { [key: string]: string } = {};
      for (const p of pactData.participants) {
        try {
          const profile = await fetchPlayerProfile(p.pubkey);
          names[p.pubkey] = profile.name || p.pubkey.substring(0, 6) + '...' + p.pubkey.substring(p.pubkey.length - 6);
        } catch (error) {
          console.error("Failed to fetch profile for participant", p.pubkey, error);
          names[p.pubkey] = p.pubkey.substring(0, 6) + '...' + p.pubkey.substring(p.pubkey.length - 6); // Fallback to truncated pubkey
        }
      }
      setParticipantNames(names);

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

  const handleCopyJoinCode = () => {
    if (pact.code) {
      Clipboard.setString(pact.code);
      Alert.alert('Copied', 'Pact join code copied to clipboard!');
    }
  };

  const renderPactDetails = () => {
    if (!pact) return null;
    console.log(pact);
    const participants = pact.participants || [];
    const activeParticipants = participants.filter(p => p.is_eliminated === 0);
    const eliminatedParticipants = participants.filter(p => p.is_eliminated === 1);
    const isUserInPact = userPublicKey && participants.some(p => p.pubkey === userPublicKey);

    return (
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: DesignSystem.spacing.md,
          paddingBottom: insets.bottom + 120, // Space for the button
        }}
      >
        <View style={styles.pactInfoContainer}>
          <View style={styles.goalCard}>
            <IconSymbol name="logo.github" size={24} color={DesignSystem.colors.white} />
            <ThemedText style={styles.goalText}>{pact.goal_value} {pact.goal_type}</ThemedText>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <PieChart active={activeParticipants.length} total={participants.length}>
            <ThemedText style={styles.chartLabel}>{`${activeParticipants.length} Active`}</ThemedText>
            <ThemedText style={styles.chartSubLabel}>{`/ ${participants.length} Total`}</ThemedText>
          </PieChart>
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

        {isUserInPact ? (
          <ThemedText style={styles.alreadyInPactText}>You are already in this pact.</ThemedText>
        ) : (
          <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + DesignSystem.spacing.sm }]}>
            <TouchableOpacity style={styles.button} onPress={handleJoinPact}>
                <ThemedText style={styles.buttonText}>Join Pact</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
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
            <ThemedText type="title" style={styles.pactSummaryTitle}>{pact ? pact.name : 'Join a Pact'}</ThemedText>
            {pact && (
              <View>
                  <ThemedText style={styles.statusText}>{pact.status}</ThemedText>
                <ThemedText style={styles.pactSummaryDescription}>{pact.description}</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.pactSummaryRight}>
            <ThemedText style={styles.prizePoolAmount}>{pact ? pact.prize_pool : '---'}</ThemedText>
            <ThemedText style={styles.prizePoolLabel}>Prize Pool</ThemedText>
          </View>
        </LinearGradient>
      </View>

      <View style={[styles.sheetContainer, { height: sheetHeight, top: topCardHeight + insets.top }]}>
        <BlurView intensity={50} tint="dark" style={styles.sheet}>
          {!pact ? (
            <View style={styles.content}>
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
  content: {
    padding: DesignSystem.spacing.md,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
  },
  button: {
    backgroundColor: DesignSystem.colors.neonMint,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    marginTop: DesignSystem.spacing.md,
    width: '100%',
  },
  buttonText: {
    color: DesignSystem.colors.charcoalBlack,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
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
  statusBadge: {
    backgroundColor: DesignSystem.colors.neonMint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.full,
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
  shareButton: {
    padding: DesignSystem.spacing.xs,
  },
});