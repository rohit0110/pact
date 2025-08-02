import React, { useState } from 'react';
import { TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { createPlayerProfile } from '@/services/api/pactService';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { PublicKey } from '@solana/web3.js';

export default function CreateProfileScreen() {
  const { wallets } = useEmbeddedSolanaWallet();
  const [name, setName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {

    if (!wallets || wallets.length === 0 ) {
      Alert.alert('Error', 'User not logged in or provider not available.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }

    if(!githubUsername.trim()) {
      Alert.alert('Missing Information', 'Please enter your GitHub username.');
      return;
    }

    setLoading(true);
    try {
      const userPublicKey = new PublicKey(wallets[0].address);
      const provider = await wallets[0].getProvider();
      await createPlayerProfile(userPublicKey, name, githubUsername, provider); 
      Alert.alert('Success', 'Profile created successfully!');
      router.replace('/(tabs)/profile'); // Redirect to home screen
    } catch (error) {
      console.error('Failed to create profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Your Player Profile</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor={Colors.dark.icon}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your GitHub username"
        placeholderTextColor={Colors.dark.icon}
        value={githubUsername} // Assuming you want to use the same input for GitHub username
        onChangeText={setGithubUsername}
      />
      <Button
        title={loading ? "Creating..." : "Create Profile"}
        onPress={handleCreateProfile}
        color={Colors.dark.tint}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    color: Colors.dark.text,
  },
});
