import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // Hide the default header since we're using custom headers
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="police-dashboard" />
        <Stack.Screen name="hospital-dashboard" />
        <Stack.Screen name="ambulance-dashboard" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}