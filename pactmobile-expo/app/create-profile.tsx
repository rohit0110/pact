import React, { useState } from 'react';
import { TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { createPlayerProfile } from '@/services/api/pactService';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { PublicKey } from '@solana/web3.js';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Your Player Profile</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor={DesignSystem.colors.icyAqua}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your GitHub username"
        placeholderTextColor={DesignSystem.colors.icyAqua}
        value={githubUsername}
        onChangeText={setGithubUsername}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateProfile}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>{loading ? "Creating..." : "Create Profile"}</ThemedText>
      </TouchableOpacity>
      {loading && <ActivityIndicator style={{ marginTop: 10 }} color={DesignSystem.colors.neonMintVibrant} />}
    </LinearGradient>
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
    marginBottom: DesignSystem.spacing.lg,
    color: DesignSystem.colors.white,
  },
  input: {
    width: '100%',
    padding: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(141, 255, 240, 0.2)',
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    borderRadius: DesignSystem.borderRadius.md,
    marginVertical: DesignSystem.spacing.sm,
    color: DesignSystem.colors.white,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.neonMint,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.sm,
  },
  buttonText: {
    color: DesignSystem.colors.charcoalBlack,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
