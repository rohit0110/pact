import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { usePrivy } from '@privy-io/expo';
import React from 'react';

export default function HomeScreen() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Loading Privy...</Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>You are not logged in.</Text>
        <Button title="Login with Privy" onPress={login} />
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
  text: {
    fontSize: 18,
    marginVertical: 12,
    textAlign: 'center',
  },
});
