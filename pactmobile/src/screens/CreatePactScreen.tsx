
import React from 'react';
import { View, Text, TextInput,StyleSheet, TouchableOpacity } from 'react-native';

const CreatePactScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Pact</Text>
      <TextInput
        style={styles.input}
        placeholder="Pact Name"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Stakes (USD)"
        placeholderTextColor="#888"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Duration (days)"
        placeholderTextColor="#888"
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.createPactButton} onPress={() => {}}>
        <Text style={styles.createPactButtonText}>Create Pact</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#1c1c1e',
    fontSize: 16,
    color: '#fff',
  },
  createPactButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25, // Rounded corners
    marginTop: 10,
  },
  createPactButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreatePactScreen;
