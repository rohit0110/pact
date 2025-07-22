
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

export default function PactDashboardPage() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Pact to learn React Native</ThemedText>
      <ThemedText style={styles.description}>Complete the main quest of building a mobile app.</ThemedText>
      <View style={styles.detailsContainer}>
        <ThemedText style={styles.detail}>Status: In Progress</ThemedText>
        <ThemedText style={styles.detail}>Participants: 1</ThemedText>
        <ThemedText style={styles.detail}>Due Date: 2025-12-31</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: Colors.palette.darkBlue,
    borderRadius: 8,
  },
  detail: {
    color: Colors.dark.text,
    marginBottom: 8,
  },
});
