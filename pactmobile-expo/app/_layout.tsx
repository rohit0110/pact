// app/_layout.tsx
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';

import { PrivyProvider } from '@privy-io/expo';
import { Slot } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const PRIVY_APP_ID = Constants.expoConfig?.extra?.PRIVY_APP_ID;
const PRIVY_CLIENT_ID = Constants.expoConfig?.extra?.PRIVY_CLIENT_ID;
console.log('PRIVY IDs:', { PRIVY_APP_ID, PRIVY_CLIENT_ID });

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
        <StatusBar style="auto" />
        <Slot />
      </SafeAreaProvider>
    </PrivyProvider>
  );
}
