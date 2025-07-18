import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import CreatePactScreen from './src/screens/CreatePactScreen';
import PactDashboardScreen from './src/screens/PactDashboardScreen';

const Stack = createStackNavigator();

// Dummy component for ProfileScreen if it doesn't exist
const ProfileScreen = () => <View><Text>Profile Screen</Text></View>;

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen name="CreatePact" component={CreatePactScreen} />
        <Stack.Screen name="PactDashboard" component={PactDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;