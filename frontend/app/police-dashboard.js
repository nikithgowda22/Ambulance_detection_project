// frontend/screens/PoliceDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Button } from 'react-native';
import WebSocketService from '../services/websocketService';

const policedashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    WebSocketService.connect('police');
    
    // Handle incoming messages
    const handleMessage = (data) => {
      if (data.type === 'alert') {
        // Add new alert to the list
        setAlerts(prevAlerts => [data, ...prevAlerts.slice(0, 9)]); // Keep only last 10 alerts
        
        // Show immediate notification
        Alert.alert(
          'Ambulance Alert',
          data.message,
          [{ text: 'OK' }]
        );
      }
    };
    
    // Handle connection status changes
    const checkConnection = setInterval(() => {
      setIsConnected(WebSocketService.isConnected);
    }, 1000);
    
    WebSocketService.addMessageHandler(handleMessage);
    
    // Clean up on component unmount
    return () => {
      WebSocketService.removeMessageHandler(handleMessage);
      WebSocketService.disconnect();
      clearInterval(checkConnection);
    };
  }, []);

  const handleReconnect = () => {
    WebSocketService.connect('police');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Police Dashboard</Text>
      
      <View style={styles.connectionStatus}>
        <Text style={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {!isConnected && (
          <Button title="Reconnect" onPress={handleReconnect} />
        )}
      </View>
      
      <Text style={styles.subtitle}>Recent Alerts:</Text>
      
      <ScrollView style={styles.alertsContainer}>
        {alerts.length === 0 ? (
          <Text style={styles.noAlerts}>No alerts received yet</Text>
        ) : (
          alerts.map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>
                {new Date(alert.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  connected: {
    color: 'green',
    fontWeight: 'bold',
  },
  disconnected: {
    color: 'red',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  alertsContainer: {
    flex: 1,
  },
  noAlerts: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 8,
    color: '#d32f2f',
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default policedashboard;