import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={85}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.97)' }]} />
          ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,0,0,0.07)',
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          backgroundColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Your Crops',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="leaf.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="soil"
        options={{
          title: 'Soil Health',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-doctor"
        options={{
          title: 'Plant Doctor',
          tabBarStyle: { display: 'none' }, // Hide tab bar for full-screen camera
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: '#16a34a',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Platform.OS === 'ios' ? 24 : 14,
              shadowColor: '#16a34a',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
              elevation: 10,
              borderWidth: 2,
              borderColor: 'white'
            }}>
              <IconSymbol size={28} name="camera.fill" color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Dosage',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="flask.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Eco-Shield',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 26 : 24} name="shield.lefthalf.filled" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
