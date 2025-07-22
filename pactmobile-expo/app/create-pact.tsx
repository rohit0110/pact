
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import { createPact } from '../services/api/pactService';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { PublicKey } from '@solana/web3.js';

const pactTypes = [
  { label: 'Daily Steps', value: 'DailySteps' },
  { label: 'Daily Run (km)', value: 'DailyRunKm' },
  { label: 'Daily Calories Burned', value: 'DailyCaloriesBurned' },
  { label: 'Daily Screen Time (max)', value: 'DailyScreenTimeMax' },
  { label: 'Daily Phone Pickups (max)', value: 'DailyPhonePickupsMax' },
  { label: 'Daily Github Contribution', value: 'DailyGithubContribution' },
  { label: 'Daily LeetCode Problems', value: 'DailyLeetCodeProblems' },
  { label: 'Total Steps', value: 'TotalSteps' },
  { label: 'Total Calories Burned', value: 'TotalCaloriesBurned' },
  { label: 'Total Distance (km)', value: 'TotalDistanceKm' },
  { label: 'Total LeetCode Solved', value: 'TotalLeetCodeSolved' },
];

export default function CreatePactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const embeddedSolanaWallet = useEmbeddedSolanaWallet();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stake, setStake] = useState('');
  const [pactType, setPactType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePact = async () => {
    if (!name || !description || !stake || !pactType) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    if (!embeddedSolanaWallet || !embeddedSolanaWallet.wallets || embeddedSolanaWallet.wallets.length === 0) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to create a pact.');
      return;
    }
    const wallet = embeddedSolanaWallet.wallets[0];

    if (!wallet || !wallet.publicKey) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to create a pact.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = await wallet.getProvider();
      if (!provider) {
        throw new Error('Failed to get wallet provider.');
      }
      const walletPublicKey = new PublicKey(wallet.publicKey);
      await createPact({
        name,
        description,
        stake: parseFloat(stake),
        pactType,
      }, walletPublicKey, provider);
      Alert.alert('Success', 'Pact created successfully!');
      router.back();
    } catch (e) {
      const errorMessage = typeof e === 'object' && e !== null && 'message' in e ? (e as { message?: string }).message : 'Failed to create pact.';
      setError(errorMessage || 'Failed to create pact.');
      Alert.alert('Error', errorMessage || 'Failed to create pact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title" style={{ marginBottom: 20 }}>Create a New Pact</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Pact Name"
        placeholderTextColor={Colors.dark.icon}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Pact Details"
        placeholderTextColor={Colors.dark.icon}
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Stake"
        placeholderTextColor={Colors.dark.icon}
        keyboardType="numeric"
        value={stake}
        onChangeText={setStake}
      />
      <RNPickerSelect
        onValueChange={(value) => setPactType(value)}
        items={pactTypes}
        style={pickerSelectStyles}
        placeholder={{ label: "Select a pact type", value: null }}
        value={pactType}
      />
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      <Button
        title={loading ? "Creating..." : "Create Pact"}
        onPress={handleCreatePact}
        color={Colors.dark.tint}
        disabled={loading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: Colors.dark.icon,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    color: Colors.dark.text,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.dark.icon,
    borderRadius: 4,
    color: Colors.dark.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 16,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: Colors.dark.icon,
    borderRadius: 8,
    color: Colors.dark.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 16,
  },
});
