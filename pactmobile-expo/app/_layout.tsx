import { PrivyProvider } from '@privy-io/expo';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const PRIVY_APP_ID = Constants.expoConfig?.extra?.PRIVY_APP_ID;
const PRIVY_CLIENT_ID = Constants.expoConfig?.extra?.PRIVY_CLIENT_ID;

export default function RootLayout() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={{
        embedded: {
            solana: {
                createOnLogin: 'users-without-wallets',
            },
        },
    }}>
      <SafeAreaProvider>
      <Stack initialRouteName='index'>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-pact" options={{ headerShown: false }} />
        <Stack.Screen name="create-profile" options={{ headerShown: false }} />
        <Stack.Screen name="join-pact" options={{ headerShown: false }} />
        <Stack.Screen name="pact-dashboard" options={{ headerShown: false }} />
      </Stack>
      </SafeAreaProvider>
    </PrivyProvider>
  );
}