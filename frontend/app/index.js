import { useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useRouter } from "expo-router";

// Keep the splash visible until we hide it manually
SplashScreen.preventAutoHideAsync();

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        // ⏳ Simulate loading (e.g., fonts, data, auth, etc.)
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        // ✅ Hide splash once ready
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  const navigateToRole = (role) => {
    switch (role) {
      case 'police':
        router.push('/police-dashboard');
        break;
      case 'hospital':
        router.push('/hospital-dashboard');
        break;
      case 'ambulance':
        router.push('/ambulance-dashboard');
        break;
      default:
        console.log('Unknown role');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Response System</Text>
      <Text style={styles.subtitle}>Select your role to continue</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, styles.policeButton]} 
          onPress={() => navigateToRole('police')}
        >
          <Text style={styles.buttonText}>🚓 Police Dashboard</Text>
          <Text style={styles.buttonSubtext}>Monitor emergency alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, styles.hospitalButton]} 
          onPress={() => navigateToRole('hospital')}
        >
          <Text style={styles.buttonText}>🏥 Hospital Dashboard</Text>
          <Text style={styles.buttonSubtext}>Manage patient intake</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, styles.ambulanceButton]} 
          onPress={() => navigateToRole('ambulance')}
        >
          <Text style={styles.buttonText}>🚑 Ambulance Driver</Text>
          <Text style={styles.buttonSubtext}>Emergency response</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f9fa"
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2c3e50"
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 40
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    gap: 16
  },
  roleButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  policeButton: {
    backgroundColor: "#3498db"
  },
  hospitalButton: {
    backgroundColor: "#e74c3c"
  },
  ambulanceButton: {
    backgroundColor: "#f39c12"
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4
  },
  buttonSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center"
  }
});