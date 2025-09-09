import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import WebSocketService from '../services/websocketService';

const ambulancedashboard = () => {
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('available'); // available, responding, busy
  const router = useRouter();

  useEffect(() => {
    // Connect to WebSocket when component mounts
    WebSocketService.connect('ambulance');
    
    // Handle incoming messages
    const handleMessage = (data) => {
      if (data.type === 'emergency_call') {
        // Add new emergency call to the list
        setEmergencyCalls(prevCalls => [data, ...prevCalls]);
        
        // Show immediate notification
        Alert.alert(
          'Emergency Call',
          data.message,
          [
            { text: 'Ignore', style: 'cancel' },
            { text: 'Respond', onPress: () => respondToCall(data) }
          ]
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
    WebSocketService.connect('ambulance');
  };

  const goBack = () => {
    router.back();
  };

  const respondToCall = (call) => {
    setCurrentStatus('responding');
    // Update the call status
    setEmergencyCalls(prevCalls => 
      prevCalls.map(c => 
        c.id === call.id ? { ...c, status: 'responding' } : c
      )
    );
    
    // Send response to server
    WebSocketService.sendMessage({
      type: 'ambulance_response',
      callId: call.id,
      status: 'responding'
    });
  };

  const completeCall = (callId) => {
    setCurrentStatus('available');
    // Update the call status
    setEmergencyCalls(prevCalls => 
      prevCalls.map(c => 
        c.id === callId ? { ...c, status: 'completed' } : c
      )
    );
    
    // Send completion to server
    WebSocketService.sendMessage({
      type: 'call_completed',
      callId: callId
    });
  };

  const sendAlert = () => {
    // Send alert to police and hospital
    WebSocketService.sendMessage({
      type: 'ambulance_alert',
      message: `Ambulance en route to hospital with patient - ETA 10 minutes`,
      timestamp: new Date().toISOString()
    });
    
    Alert.alert(
      'Alert Sent',
      'Police and Hospital have been notified',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ambulance Driver</Text>
      </View>
      
      <View style={styles.statusContainer}>
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
        
        <View style={styles.driverStatus}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[
            styles.statusValue,
            currentStatus === 'available' ? styles.availableStatus :
            currentStatus === 'responding' ? styles.respondingStatus : styles.busyStatus
          ]}>
            {currentStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.alertButton}
          onPress={sendAlert}
          disabled={currentStatus === 'available'}
        >
          <Text style={styles.alertButtonText}>🚨 Send Alert to Police & Hospital</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>Emergency Calls:</Text>
      
      <ScrollView style={styles.callsContainer}>
        {emergencyCalls.length === 0 ? (
          <View style={styles.noCallsContainer}>
            <Text style={styles.noCalls}>No emergency calls</Text>
            <Text style={styles.noCallsSubtext}>Emergency calls will appear here</Text>
          </View>
        ) : (
          emergencyCalls.map((call, index) => (
            <View key={index} style={styles.callCard}>
              <View style={styles.callInfo}>
                <Text style={styles.callMessage}>{call.message}</Text>
                <Text style={styles.callTime}>
                  {new Date(call.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.callActions}>
                <Text style={[
                  styles.callStatusText,
                  call.status === 'completed' ? styles.completedStatus :
                  call.status === 'responding' ? styles.respondingCallStatus : styles.pendingStatus
                ]}>
                  {call.status || 'Pending'}
                </Text>
                {call.status === 'responding' && (
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={() => completeCall(call.id)}
                  >
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
                {!call.status && (
                  <TouchableOpacity 
                    style={styles.respondButton}
                    onPress={() => respondToCall(call)}
                  >
                    <Text style={styles.respondButtonText}>Respond</Text>
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
    color: '#f39c12',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  statusContainer: {
    marginBottom: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reconnectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  driverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginRight: 12,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableStatus: {
    color: '#27ae60',
  },
  respondingStatus: {
    color: '#f39c12',
  },
  busyStatus: {
    color: '#e74c3c',
  },
  actionsContainer: {
    marginBottom: 16,
  },
  alertButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#34495e',
  },
  callsContainer: {
    flex: 1,
  },
  noCallsContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noCalls: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  noCallsSubtext: {
    textAlign: 'center',
    color: '#bdc3c7',
    fontSize: 14,
    marginTop: 8,
  },
  callCard: {
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
    borderLeftColor: '#f39c12',
  },
  callInfo: {
    marginBottom: 12,
  },
  callMessage: {
    fontSize: 16,
    marginBottom: 8,
    color: '#2c3e50',
    fontWeight: '500',
  },
  callTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingStatus: {
    color: '#95a5a6',
  },
  respondingCallStatus: {
    color: '#f39c12',
  },
  completedStatus: {
    color: '#27ae60',
  },
  respondButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  respondButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  });

export default ambulancedashboard;