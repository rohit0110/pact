
import React from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View>
      <Text>Home Screen</Text>
      <Button title="Create a Pact" onPress={() => navigation.navigate('CreatePact')} />
      <Button title="View Dashboard" onPress={() => navigation.navigate('PactDashboard')} />
      <Button title="My Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
};

export default HomeScreen;
