import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { DesignSystem } from '@/constants/DesignSystem';
import { Image } from 'expo-image';
import { useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import { fetchPlayerProfile } from '../../services/api/pactService';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={DesignSystem.colors.neonMintVibrant} />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: DesignSystem.spacing.md }}>
          <ThemedText>Error: {error.message}</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!profileData) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>No profile data available.</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DesignSystem.gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
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
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: DesignSystem.spacing.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neonMintVibrant,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignSystem.spacing.md,
    marginHorizontal: DesignSystem.spacing.md,
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(141, 255, 240, 0.2)',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DesignSystem.colors.white,
  },
  statLabel: {
    marginTop: 4,
    color: DesignSystem.colors.icyAqua,
  },
  logoutButtonContainer: {
    margin: DesignSystem.spacing.md,
    paddingBottom: 80, // Ensure it's above the tab bar
  },
  logoutButton: {
    backgroundColor: 'rgba(197, 255, 248, 0.1)',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(141, 255, 240, 0.2)',
  },
  logoutButtonText: {
    color: DesignSystem.colors.white,
    fontWeight: 'bold',
  },
});

