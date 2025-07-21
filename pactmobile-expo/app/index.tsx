import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { usePrivy, useLoginWithEmail } from '@privy-io/expo';

export default function HomeScreen() {
  const { isReady, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Initializing Privy...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Login with Email</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {codeSent && (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter code"
            style={styles.input}
            keyboardType="number-pad"
          />
        )}

        {!codeSent ? (
          <Button
            title="Send Code"
            onPress={async () => {
              setLoading(true);
              try {
                await sendCode({ email });
                setCodeSent(true);
              } catch (err) {
                console.error('Send code error:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : (
          <Button
            title="Login"
            onPress={async () => {
              setLoading(true);
              try {
                await loginWithCode({ email, code });
              } catch (err) {
                console.error('Login error:', err);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {loading && <ActivityIndicator size="small" style={{ marginTop: 10 }} />}
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.text}>Welcome, {user?.email || user?.wallet?.address} 👋</Text>
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
