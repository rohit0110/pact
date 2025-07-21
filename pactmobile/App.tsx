import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen'; // Import AuthScreen
import CreatePactScreen from './src/screens/CreatePactScreen';
import PactDashboardScreen from './src/screens/PactDashboardScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen name="CreatePact" component={CreatePactScreen} />
        <Stack.Screen name="PactDashboard" component={PactDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;