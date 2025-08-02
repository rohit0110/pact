import React, { useState, useEffect } from 'react';
import {
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  usePrivy,
  useLoginWithEmail,
  useLoginWithOAuth,
  useEmbeddedSolanaWallet
} from '@privy-io/expo';
import { fetchPlayerProfile } from '@/services/api/pactService';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignSystem } from '@/constants/DesignSystem';
import { ThemedText } from '@/components/ThemedText';

export default function LoginScreen() {
  const { isReady, user } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login: loginWithGoogle } = useLoginWithOAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const handleUserLogin = async () => {
      if (!user || !wallets || wallets.length === 0) return;

      setProfileLoading(true);
      try {
        const playerPubkey = wallets[0].address;
        await fetchPlayerProfile(playerPubkey);
        console.log(playerPubkey);
        router.replace('/(tabs)/pact');
      } catch (error) {
        router.replace('/create-profile');
      } finally {
        setProfileLoading(false);
      }
    };

    handleUserLogin();
  }, [user, wallets]);

  if (!isReady || profileLoading) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.centered}>
        <ActivityIndicator size="large" color={DesignSystem.colors.neonMintVibrant} />
        <ThemedText style={styles.text}>Initializing...</ThemedText>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={DesignSystem.gradients.background} style={styles.centered}>
        <ThemedText type="title" style={styles.title}>Pact</ThemedText>

        <TouchableOpacity
          style={styles.button}
          disabled={googleLoading}
          onPress={async () => {
            try {
              setGoogleLoading(true);
              await loginWithGoogle({ provider: 'google' });
            } catch (err) {
              console.error('Google login failed', err);
            } finally {
              setGoogleLoading(false);
            }
          }}
        >
          <ThemedText style={styles.buttonText}>Login with Google</ThemedText>
        </TouchableOpacity>

        <ThemedText style={{ marginVertical: 16, color: DesignSystem.colors.icyAqua }}>OR</ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={DesignSystem.colors.icyAqua}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {codeSent && (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter code"
            placeholderTextColor={DesignSystem.colors.icyAqua}
            style={styles.input}
            keyboardType="number-pad"
          />
        )}

        {!codeSent ? (
          <TouchableOpacity
            style={styles.button}
            disabled={otpLoading}
            onPress={async () => {
              setOtpLoading(true);
              try {
                await sendCode({ email });
                setCodeSent(true);
              } catch (err) {
                console.error('Send code error:', err);
              } finally {
                setOtpLoading(false);
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Send Code</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            disabled={otpLoading}
            onPress={async () => {
              setOtpLoading(true);
              try {
                await loginWithCode({ email, code });
              } catch (err) {
                console.error('Login error:', err);
              } finally {
                setOtpLoading(false);
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Login with Code</ThemedText>
          </TouchableOpacity>
        )}

        {(otpLoading || googleLoading) && (
          <ActivityIndicator size="small" style={{ marginTop: 10 }} color={DesignSystem.colors.neonMintVibrant} />
        )}
      </LinearGradient>
    );
  }

  return null; // Or a loading indicator while redirecting
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    marginBottom: DesignSystem.spacing.xl,
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
  text: {
    fontSize: 18,
    marginVertical: 12,
    textAlign: 'center',
    color: DesignSystem.colors.icyAquaLight,
  },
});
