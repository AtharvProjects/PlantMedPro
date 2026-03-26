import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import 'react-native-reanimated';

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
