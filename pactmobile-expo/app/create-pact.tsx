
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import { createPact } from '../services/api/pactService';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { PublicKey } from '@solana/web3.js';

const goalTypes = [
  { label: 'Daily Steps', value: { dailySteps: {} } },
  { label: 'Daily Run (km)', value: { dailyRunKm: {} } },
  { label: 'Daily Calories Burned', value: { dailyCaloriesBurned: {} } },
  { label: 'Daily Screen Time (max)', value: { dailyScreenTimeMax: {} } },
  { label: 'Daily Phone Pickups (max)', value: { dailyPhonePickupsMax: {} } },
  { label: 'Daily Github Contribution', value: { dailyGithubContribution: {} } },
  { label: 'Daily LeetCode Problems', value: { dailyLeetCodeProblems: {} } },
  { label: 'Total Steps', value: { totalSteps: {} } },
  { label: 'Total Calories Burned', value: { totalCaloriesBurned: {} } },
  { label: 'Total Distance (km)', value: { totalDistanceKm: {} } },
  { label: 'Total LeetCode Solved', value: { totalLeetCodeSolved: {} } },
];

const verificationTypes = [
  { label: 'Screen Time', value: { screenTime: {} } },
  { label: 'Github API', value: { gitHubApi: {} } },
  { label: 'LeetCode Scrape', value: { leetCodeScrape: {} } },
  { label: 'Strava', value: { strava: {} } },
];

const comparisonOperators = [
  { label: 'Greater Than or Equal', value: { greaterThanOrEqual: {} } },
  { label: 'Less Than or Equal', value: { lessThanOrEqual: {} } },
];

export default function CreatePactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallets } = useEmbeddedSolanaWallet();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stake, setStake] = useState('');
  const [goalType, setGoalType] = useState(null);
  const [goalValue, setGoalValue] = useState('');
  const [verificationType, setVerificationType] = useState(null);
  const [comparisonOperator, setComparisonOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePact = async () => {
    if (!name || !description || !stake || !goalType || !goalValue || !verificationType || !comparisonOperator) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    if (!wallets || wallets.length === 0) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to create a pact.');
      return;
    }
    const wallet = wallets[0];

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
        goalType,
        goalValue: parseInt(goalValue, 10),
        verificationType,
        comparisonOperator,
        pactType: ''
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          placeholder="Stake (in SOL)"
          placeholderTextColor={Colors.dark.icon}
          keyboardType="numeric"
          value={stake}
          onChangeText={setStake}
        />
        <RNPickerSelect
          onValueChange={(value) => setGoalType(value)}
          items={goalTypes}
          style={pickerSelectStyles}
          placeholder={{ label: "Select a Goal Type", value: null }}
          value={goalType}
        />
        <TextInput
          style={styles.input}
          placeholder="Goal Value"
          placeholderTextColor={Colors.dark.icon}
          keyboardType="numeric"
          value={goalValue}
          onChangeText={setGoalValue}
        />
        <RNPickerSelect
          onValueChange={(value) => setVerificationType(value)}
          items={verificationTypes}
          style={pickerSelectStyles}
          placeholder={{ label: "Select a Verification Type", value: null }}
          value={verificationType}
        />
        <RNPickerSelect
          onValueChange={(value) => setComparisonOperator(value)}
          items={comparisonOperators}
          style={pickerSelectStyles}
          placeholder={{ label: "Select a Comparison Operator", value: null }}
          value={comparisonOperator}
        />
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        <Button
          title={loading ? "Creating..." : "Create Pact"}
          onPress={handleCreatePact}
          color={Colors.dark.tint}
          disabled={loading}
        />
        {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
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
