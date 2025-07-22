
import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const pacts = [
  { id: '1', title: 'Pact to learn React Native', description: 'Complete the main quest of building a mobile app.', status: 'Active', prizePool: 100 },
  { id: '2', title: 'Pact to go to the gym', description: 'Go to the gym 3 times a week for a month.', status: 'Initialize', prizePool: 50 },
  { id: '3', title: 'Pact to read a book', description: 'Finish reading "The Hitchhiker\'s Guide to the Galaxy".', status: 'Active', prizePool: 25 },
];

export default function PactPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: { id: string; title: string; description: string; status: string; prizePool: number } }) => (
    <TouchableOpacity onPress={() => router.push('/pact-dashboard')}>
      <View style={styles.pactContainer}>
        <View style={styles.pactHeader}>
          <ThemedText type="subtitle" style={styles.pactTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.pactStatus}>{item.status}</ThemedText>
        </View>
        <ThemedText style={styles.pactDescription}>{item.description}</ThemedText>
        <ThemedText style={styles.prizePool}>${item.prizePool}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={pacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Your Pacts</ThemedText>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-pact')}>
        <IconSymbol name="plus" size={28} color={Colors.dark.background} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  pactContainer: {
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.palette.darkBlue,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.palette.lightBlue,
  },
  pactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pactTitle: {
    fontWeight: 'bold',
  },
  pactStatus: {
    fontStyle: 'italic',
  },
  pactDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  prizePool: {
    textAlign: 'right',
    fontWeight: 'bold',
    color: Colors.dark.tint,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: Colors.dark.tint,
    borderRadius: 28,
    elevation: 8,
  },
});
