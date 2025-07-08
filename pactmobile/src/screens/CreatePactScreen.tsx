
import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

const CreatePactScreen = () => {
  return (
    <View>
      <Text>Create a New Pact</Text>
      <TextInput placeholder="Pact Name" />
      <TextInput placeholder="Stakes (USD)" keyboardType="numeric" />
      <TextInput placeholder="Duration (days)" keyboardType="numeric" />
      <Button title="Create Pact" onPress={() => {}} />
    </View>
  );
};

export default CreatePactScreen;
