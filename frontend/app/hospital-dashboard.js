import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import WebSocketService from '../services/websocketService';

const hospitaldashboard = () => {
  const [patients, setPatients] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Connect to WebSocket when component mounts
    WebSocketService.connect('hospital');
    
    // Handle incoming messages
    const handleMessage = (data) => {
      if (data.type === 'patient_incoming') {
        // Add new patient to the list
        setPatients(prevPatients => [data, ...prevPatients]);
        
        // Show immediate notification
        Alert.alert(
          'Patient Incoming',
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
    WebSocketService.connect('hospital');
  };

  const goBack = () => {
    router.back();
  };

  const markPatientReceived = (index) => {
    setPatients(prevPatients => 
      prevPatients.map((patient, i) => 
        i === index ? { ...patient, status: 'received' } : patient
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hospital Dashboard</Text>
      </View>
      
      <View style={styles.connectionStatus}>
        <Text style={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
        {!isConnected && (
          <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
            <Text style={styles.reconnectButtonText}>Reconnect</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.subtitle}>Incoming Patients:</Text>
      
      <ScrollView style={styles.patientsContainer}>
        {patients.length === 0 ? (
          <View style={styles.noPatientsContainer}>
            <Text style={styles.noPatients}>No incoming patients</Text>
            <Text style={styles.noPatientsSubtext}>Patient alerts will appear here</Text>
          </View>
        ) : (
          patients.map((patient, index) => (
            <View key={index} style={styles.patientCard}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientMessage}>{patient.message}</Text>
                <Text style={styles.patientTime}>
                  {new Date(patient.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.patientActions}>
                <Text style={[
                  styles.statusText,
                  patient.status === 'received' ? styles.receivedStatus : styles.incomingStatus
                ]}>
                  {patient.status === 'received' ? 'Received' : 'Incoming'}
                </Text>
                {patient.status !== 'received' && (
                  <TouchableOpacity 
                    style={styles.receiveButton}
                    onPress={() => markPatientReceived(index)}
                  >
                    <Text style={styles.receiveButtonText}>Mark Received</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connected: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disconnected: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reconnectButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reconnectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495e',
  },
  patientsContainer: {
    flex: 1,
  },
  noPatientsContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noPatients: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  noPatientsSubtext: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 14,
    marginTop: 8,
  },
  patientCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  patientInfo: {
    marginBottom: 12,
  },
  patientMessage: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
    fontWeight: '500',
  },
  patientTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  incomingStatus: {
    color: '#f39c12',
  },
  receivedStatus: {
    color: '#27ae60',
  },
  receiveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  receiveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default hospitaldashboard;