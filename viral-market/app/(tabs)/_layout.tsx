import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A9D8E',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          height: 80, // Slightly taller for better safe area padding
          paddingHorizontal: 100, // Squeezes the two icons into the center
          paddingBottom: 20, // Balances top/bottom padding including safe areas
          paddingTop: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: 'Party',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={30} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}