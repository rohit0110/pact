import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Image } from 'expo-image';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import { fetchPlayerProfile } from '../../services/api/pactService';
import { router } from 'expo-router';

type PlayerProfileApiType = {
  id: string;
  name: string;
  pactsWon: number;
  pactsLost: number;
};

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<PlayerProfileApiType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user, logout } = usePrivy();
  const embeddedSolanaWallet = useEmbeddedSolanaWallet();

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const wallet = embeddedSolanaWallet?.wallets?.[0];
      const walletPublicKey = wallet?.publicKey;

      if (!walletPublicKey) {
        setLoading(false);
        setError(new Error('No public key found for profile.'));
        return;
      }

      try {
        const data = await fetchPlayerProfile(walletPublicKey.toString());
        setProfileData({
          ...data,
          name: data.name || 'Unknown Player',
          pactsWon: data.pactsWon || 0,
          pactsLost: data.pactsLost || 0,
          id: data.id || 'unknown-id',
        });
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [embeddedSolanaWallet, user]);

  const handleLogout = async () => {
    if (user) {
      await logout();
    }
    router.replace('/');
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Error: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!profileData) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>No profile data available.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.profileHeader}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} style={styles.profileImage} />
          <ThemedText type="title">{profileData.name}</ThemedText>
          <ThemedText type="subtitle">@{profileData.name.toLowerCase().replace(/\s/g, '')}</ThemedText>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>{profileData.pactsWon}</ThemedText>
            <ThemedText style={styles.statLabel}>Pacts Won</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>{profileData.pactsLost}</ThemedText>
            <ThemedText style={styles.statLabel}>Pacts Lost</ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.logoutButtonContainer}>
        <Button title="Logout" onPress={handleLogout} color={Colors.dark.tint} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.icon,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.tint,
  },
  statLabel: {
    marginTop: 4,
    color: Colors.dark.icon,
  },
  logoutButtonContainer: {
    margin: 16,
  },
});
