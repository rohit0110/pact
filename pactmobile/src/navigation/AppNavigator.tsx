import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePactScreen from '../screens/CreatePactScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1c1c1e' },
          headerTitleStyle: { color: '#fff' },
          tabBarStyle: { backgroundColor: '#1c1c1e', borderTopColor: '#333' },
          tabBarActiveTintColor: '#007aff',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="Pacts" 
          component={HomeScreen} 
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
        />
      </Tab.Navigator>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePact')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 80, // Adjust this value to position it above the tab bar
    backgroundColor: '#007aff',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { height: 2, width: 0 },
  },
  fabText: {
    fontSize: 24,
    color: 'white',
  },
});

export default AppNavigator;