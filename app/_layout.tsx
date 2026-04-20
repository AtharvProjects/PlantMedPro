import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import '../global.css';
import 'react-native-reanimated';

// Fix for React Native Web: "Cannot manually set color scheme, as dark mode is type 'media'"
// Must be called before any StyleSheet usage that references color scheme.
if (Platform.OS === 'web') {
  // @ts-ignore — web-only API
  if (typeof StyleSheet.setFlag === 'function') {
    // @ts-ignore
    StyleSheet.setFlag('darkMode', 'class');
  }
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="diagnosis"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="treatment"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'PlantMedPro' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

