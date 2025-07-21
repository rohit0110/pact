import * as React from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/expo';
import { Slot, Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { ActivityIndicator, View } from 'react-native';

const { PRIVY_APP_ID, PRIVY_CLIENT_ID } = Constants.expoConfig?.extra || {};

function AuthWrapper() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
    >
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthWrapper />
      </SafeAreaProvider>
    </PrivyProvider>
  );
}
