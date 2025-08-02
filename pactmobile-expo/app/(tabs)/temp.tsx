import { StyleSheet, View, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router'; // for navigation
import { usePrivy } from '@privy-io/expo'; // or your auth hook

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useEffect } from 'react';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { logout, user } = usePrivy(); // if using Privy auth

  const handleLogout = async () => {
    if(user) {
      await logout();
    }
    router.replace('/'); 
  };

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title">Welcome to Pact</ThemedText>
      <ThemedText type="subtitle">The social accountability app.</ThemedText>

      <View style={styles.featuredPact}>
        <ThemedText type="subtitle">Featured Pact</ThemedText>
        <ThemedText>Pact to run a 5k in 30 days</ThemedText>
      </View>

      {/* Logout Button - Added for testing, remove later */}
      <Button title="Logout" onPress={handleLogout} color={Colors.dark.tint} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  featuredPact: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.palette.lightBlue,
  },
});
