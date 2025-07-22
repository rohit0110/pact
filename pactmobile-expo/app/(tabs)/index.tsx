import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title">Welcome to Pact</ThemedText>
      <ThemedText type="subtitle">The social accountability app.</ThemedText>
      <View style={styles.featuredPact}>
        <ThemedText type="subtitle">Featured Pact</ThemedText>
        <ThemedText>Pact to run a 5k in 30 days</ThemedText>
      </View>
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
