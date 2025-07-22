
import React from 'react';
import { StyleSheet, View, TextInput, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';

const pactTypes = [
  { label: 'Daily Steps', value: 'DailySteps' },
  { label: 'Daily Run (km)', value: 'DailyRunKm' },
  { label: 'Daily Calories Burned', value: 'DailyCaloriesBurned' },
  { label: 'Daily Screen Time (max)', value: 'DailyScreenTimeMax' },
  { label: 'Daily Phone Pickups (max)', value: 'DailyPhonePickupsMax' },
  { label: 'Daily Github Contribution', value: 'DailyGithubContribution' },
  { label: 'Daily LeetCode Problems', value: 'DailyLeetCodeProblems' },
  { label: 'Total Steps', value: 'TotalSteps' },
  { label: 'Total Calories Burned', value: 'TotalCaloriesBurned' },
  { label: 'Total Distance (km)', value: 'TotalDistanceKm' },
  { label: 'Total LeetCode Solved', value: 'TotalLeetCodeSolved' },
];

export default function CreatePactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText type="title" style={{ marginBottom: 20 }}>Create a New Pact</ThemedText>
      <TextInput style={styles.input} placeholder="Pact Name" placeholderTextColor={Colors.dark.icon} />
      <TextInput style={styles.input} placeholder="Pact Details" placeholderTextColor={Colors.dark.icon} />
      <TextInput style={styles.input} placeholder="Stake" placeholderTextColor={Colors.dark.icon} keyboardType="numeric" />
      <RNPickerSelect
        onValueChange={(value) => console.log(value)}
        items={pactTypes}
        style={pickerSelectStyles}
        placeholder={{ label: "Select a pact type", value: null }}
      />
      <Button title="Create Pact" onPress={() => router.back()} color={Colors.dark.tint} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: Colors.dark.icon,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    color: Colors.dark.text,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.dark.icon,
    borderRadius: 4,
    color: Colors.dark.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 16,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: Colors.dark.icon,
    borderRadius: 8,
    color: Colors.dark.text,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 16,
  },
});
