import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A9D8E',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#D3D3D3',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: 'Party',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}