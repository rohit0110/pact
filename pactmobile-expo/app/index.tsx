import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  usePrivy,
  useLoginWithEmail,
  useLoginWithOAuth,
  useEmbeddedSolanaWallet
} from '@privy-io/expo';
import { fetchPlayerProfile } from '@/services/api/pactService';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { isReady, user, logout } = usePrivy();
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
      if (user) {
        setProfileLoading(true);
        try {
          // Check if player profile exists
          
          await fetchPlayerProfile(wallets![0].address);
          router.replace('/(tabs)'); // Redirect to main tabbed home screen
        } catch (error) {
          // If profile not found, redirect to create profile page
          router.replace('/create-profile');
        } finally {
          setProfileLoading(false);
        }
      }
    };

    handleUserLogin();
  }, [user]);

  if (!isReady || profileLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Initializing...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Login</Text>

        {/* Google Login Button */}
        <Button
          title="Login with Google"
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
        />

        <Text style={{ marginVertical: 16 }}>OR</Text>

        {/* Email Input */}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* OTP Input */}
        {codeSent && (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter code"
            style={styles.input}
            keyboardType="number-pad"
          />
        )}

        {/* OTP Buttons */}
        {!codeSent ? (
          <Button
            title="Send Code"
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
          />
        ) : (
          <Button
            title="Login with Code"
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
          />
        )}

        {(otpLoading || googleLoading) && (
          <ActivityIndicator size="small" style={{ marginTop: 10 }} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.text}>
        Welcome 👋
      </Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 10,
    borderRadius: 6,
  },
  text: {
    fontSize: 18,
    marginVertical: 12,
    textAlign: 'center',
  },
});
