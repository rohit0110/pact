import React, { useState } from 'react';
import { TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useEmbeddedSolanaWallet } from '@privy-io/expo';
import { createPlayerProfile } from '@/services/api/pactService';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function CreateProfileScreen() {
  const { wallets } = useEmbeddedSolanaWallet();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!wallets || wallets.length === 0) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      await createPlayerProfile(wallets[0].address, name); 
      Alert.alert('Success', 'Profile created successfully!');
      router.replace('/(tabs)'); // Redirect to home screen
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
