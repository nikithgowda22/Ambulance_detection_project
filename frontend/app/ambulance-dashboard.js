import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import WebSocketService from '../services/websocketService';

const AmbulanceDashboard = () => {
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('available'); // available, responding, en_route
  const [refreshing, setRefreshing] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [callInfo, setCallInfo] = useState({ active: false, type: null, with: null, callId: null });
  const [patientInfo, setPatientInfo] = useState({
    condition: '',
    vitals: {
      heartRate: '',
      bloodPressure: '',
      temperature: ''
    },
    allergies: '',
    medicalHistory: '',
    eta: ''
  });
  const router = useRouter();

  useEffect(() => {
    WebSocketService.connect('ambulance');
    getCurrentLocation();

    const handleMessage = (data) => {
      console.log('Ambulance received:', data);
      if (data.type === 'path_cleared') {
        Alert.alert(
          '✅ Green Corridor Cleared',
          `Police have cleared your path. You may proceed.`,
          [{ text: 'OK' }]
        );
      } else if (data.type === 'new_call') {
        setEmergencyCalls(prevCalls => [data, ...prevCalls]);
        Alert.alert('📞 New Emergency Call', data.message);
      } else if (data.type === 'call_accepted') {
        Alert.alert('✅ Call Accepted', 'The hospital has accepted your call. Connecting...');
        setCallInfo(prev => ({ ...prev, active: true, with: 'hospital' }));
      } else if (data.type === 'call_declined') {
        Alert.alert('❌ Call Declined', 'The hospital is unable to take your call at this time.');
        setCallInfo({ active: false, type: null, with: null, callId: null });
      } else if (data.type === 'call_ended') {
        Alert.alert('📞 Call Ended', 'The call with the hospital has ended.');
        setCallInfo({ active: false, type: null, with: null, callId: null });
      }
    };

    const checkConnection = setInterval(() => {
      setIsConnected(WebSocketService.isConnected);
    }, 1000);

    WebSocketService.addMessageHandler(handleMessage);

    return () => {
      WebSocketService.removeMessageHandler(handleMessage);
      clearInterval(checkConnection);
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await WebSocketService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const startCall = (callType) => {
    if (callInfo.active) {
      Alert.alert('Call in Progress', 'You are already in a call.');
      return;
    }
    const newCallId = `call-${Date.now()}`;
    setCallInfo({ active: false, type: callType, with: 'hospital', callId: newCallId });

    WebSocketService.sendMessage({
      type: 'start_call',
      callType: callType,
      callId: newCallId,
      from: 'Ambulance Unit 12', // Example ID
      timestamp: new Date().toISOString()
    });

    Alert.alert(
      `🤙 Calling Hospital (${callType})`,
      'Waiting for the hospital to respond...'
    );
  };

  const endCall = () => {
    if (!callInfo.callId) return;

    WebSocketService.sendMessage({
      type: 'end_call',
      callId: callInfo.callId,
      timestamp: new Date().toISOString()
    });
    
    Alert.alert('📞 Call Ended', 'You have ended the call.');
    setCallInfo({ active: false, type: null, with: null, callId: null });
  };
  
  const handleReconnect = () => {
    WebSocketService.connect('ambulance');
  };

  const goBack = () => {
    router.back();
  };

  const respondToCall = (call) => {
    setCurrentStatus('responding');
    setEmergencyCalls(prevCalls =>
      prevCalls.map(c =>
        c.id === call.id ? { ...c, status: 'responding' } : c
      )
    );

    WebSocketService.sendMessage({
      type: 'ambulance_response',
      callId: call.id,
      status: 'responding',
      ambulanceLocation: currentLocation,
      eta: '8-12 minutes',
      timestamp: new Date().toISOString()
    });

    Alert.alert('Response Sent', 'Emergency services have been notified of your response');
  };

  const sendSOSAlert = () => {
    setSosModalVisible(true);
  };

  const confirmSOSAlert = async () => {
    await getCurrentLocation(); 

    if (!currentLocation) {
      Alert.alert('Location Error', 'Unable to get current location. Please try again.');
      return;
    }

    const ambulanceId = `AMB-${Date.now()}`;

    WebSocketService.sendMessage({
      type: 'emergency_alert',
      id: ambulanceId,
      ambulanceId: ambulanceId,
      message: `🚨 AMBULANCE DETECTED - Requesting green corridor clearance`,
      location: currentLocation,
      status: 'detected',
      priority: 'HIGH',
      detectedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      source: 'ambulance_sos'
    });

    setSosModalVisible(false);
    setCurrentStatus('emergency');

    Alert.alert(
      'SOS Alert Sent!',
      `Police have been notified and will clear the green corridor at:\n${currentLocation.address}\n\nWait for path clearance confirmation.`,
      [{ text: 'OK' }]
    );
  };

  const sendPatientInfo = () => {
    setPatientModalVisible(true);
  };

  const submitPatientInfo = () => {
    if (!patientInfo.condition || !patientInfo.eta) {
      Alert.alert('Missing Information', 'Please fill in patient condition and ETA');
      return;
    }

    WebSocketService.sendMessage({
      type: 'patient_incoming',
      id: Date.now().toString(),
      message: `Incoming patient with ${patientInfo.condition} condition`,
      patientCondition: patientInfo.condition,
      vitals: patientInfo.vitals,
      allergies: patientInfo.allergies || 'None reported',
      medicalHistory: patientInfo.medicalHistory || 'Unknown',
      eta: patientInfo.eta,
      location: currentLocation,
      timestamp: new Date().toISOString()
    });
    
    setPatientModalVisible(false);
    setCurrentStatus('en_route');

    setPatientInfo({
      condition: '',
      vitals: { heartRate: '', bloodPressure: '', temperature: '' },
      allergies: '',
      medicalHistory: '',
      eta: ''
    });

    Alert.alert(
      'Patient Info Sent',
      'Hospital has been notified with patient details',
      [{ text: 'OK' }]
    );
  };

  const completeCall = (callId) => {
    setCurrentStatus('available');
    setEmergencyCalls(prevCalls =>
      prevCalls.map(c =>
        c.id === callId ? { ...c, status: 'completed' } : c
      )
    );

    WebSocketService.sendMessage({
      type: 'call_completed',
      callId: callId,
      message: 'Emergency call completed successfully',
      timestamp: new Date().toISOString()
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    getCurrentLocation();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'responding': return '#F59E0B';
      case 'en_route': return '#3B82F6';
      case 'emergency': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅';
      case 'responding': return '🚑';
      case 'en_route': return '🏥';
      case 'emergency': return '🚨';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F59E0B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🚑 Ambulance Unit</Text>
          <Text style={styles.subtitle}>Emergency Medical Services</Text>
        </View>
      </View>

      {/* Status & Connection */}
      <View style={styles.statusContainer}>
        <View style={styles.connectionStatus}>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isConnected ? '#10B981' : '#EF4444' }
            ]}>
              {isConnected ? 'Dispatch Connected' : 'Connection Lost'}
            </Text>
          </View>

          {!isConnected && (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
              <Text style={styles.reconnectText}>Reconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.driverStatus}>
          <Text style={styles.statusLabel}>Unit Status:</Text>
          <View style={styles.statusValueContainer}>
            <Text style={styles.statusIcon}>{getStatusIcon(currentStatus)}</Text>
            <Text style={[
              styles.statusValue,
              { color: getStatusColor(currentStatus) }
            ]}>
              {currentStatus.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {currentLocation && (
          <View style={styles.locationDisplay}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{currentLocation.address}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Emergency Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={sendSOSAlert}
        >
          <Text style={styles.sosButtonText}>🚨 EMERGENCY SOS</Text>
          <Text style={styles.sosSubtext}>Request Green Corridor Clearance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.patientButton}
          onPress={sendPatientInfo}
        >
          <Text style={styles.patientButtonText}>🏥 Send Patient Info</Text>
          <Text style={styles.patientSubtext}>Notify Hospital</Text>
        </TouchableOpacity>

        {!callInfo.active ? (
          <View style={styles.callActionsContainer}>
            <TouchableOpacity style={styles.callButton} onPress={() => startCall('voice')}>
                <Text style={styles.callButtonText}>📞 Voice Call Hospital</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callButton} onPress={() => startCall('video')}>
                <Text style={styles.callButtonText}>📹 Video Call Hospital</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
            <Text style={styles.endCallButtonText}>END CALL WITH HOSPITAL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Calls Section */}
      <View style={styles.callsSection}>
        <Text style={styles.sectionTitle}>Emergency Dispatch</Text>

        <ScrollView
          style={styles.callsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {emergencyCalls.length === 0 ? (
            <View style={styles.noCallsContainer}>
              <Text style={styles.noCallsIcon}>📻</Text>
              <Text style={styles.noCallsText}>No active calls</Text>
              <Text style={styles.noCallsSubtext}>Emergency calls will appear here</Text>
            </View>
          ) : (
            emergencyCalls.map((call, index) => (
              <View key={call.id || index} style={styles.callCard}>
                {/* Call card content would go here */}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* SOS Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sosModalVisible}
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 EMERGENCY SOS</Text>
              <TouchableOpacity onPress={() => setSosModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.warningText}>
                This will request immediate green corridor clearance from police at your current location.
              </Text>
              {currentLocation && (
                <View style={styles.locationConfirm}>
                  <Text style={styles.locationLabel}>Current Location:</Text>
                  <Text style={styles.locationValue}>{currentLocation.address}</Text>
                </View>
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setSosModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmSOSAlert}
                >
                  <Text style={styles.confirmButtonText}>REQUEST CLEARANCE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Patient Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={patientModalVisible}
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏥 Patient Information</Text>
              <TouchableOpacity onPress={() => setPatientModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Patient Condition *</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.condition}
                onChangeText={(text) => setPatientInfo(prev => ({ ...prev, condition: text }))}
                placeholder="e.g., Critical, Stable, Serious"
              />
              <Text style={styles.inputLabel}>ETA to Hospital *</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.eta}
                onChangeText={(text) => setPatientInfo(prev => ({ ...prev, eta: text }))}
                placeholder="e.g., 10 minutes"
              />
              <Text style={styles.sectionLabel}>Vitals (Optional)</Text>
              <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.heartRate}
                onChangeText={(text) => setPatientInfo(prev => ({ ...prev, vitals: { ...prev.vitals, heartRate: text } }))}
                placeholder="e.g., 80"
                keyboardType="numeric"
              />
              <Text style={styles.inputLabel}>Blood Pressure</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.bloodPressure}
                onChangeText={(text) => setPatientInfo(prev => ({ ...prev, vitals: { ...prev.vitals, bloodPressure: text } }))}
                placeholder="e.g., 120/80"
              />
              <Text style={styles.inputLabel}>Temperature (°C)</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.temperature}
                onChangeText={(text) => setPatientInfo(prev => ({ ...prev, vitals: { ...prev.vitals, temperature: text } }))}
                placeholder="e.g., 36.5"
                keyboardType="numeric"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPatientModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitPatientInfo}
                >
                  <Text style={styles.submitButtonText}>Send Info</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#F59E0B', paddingVertical: 20, paddingHorizontal: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  backButton: { marginBottom: 10, alignSelf: 'flex-start', marginTop: 25 },
  backButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  headerContent: { alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#fef3c7', opacity: 0.9 },
  statusContainer: { backgroundColor: 'white', margin: 16, borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  connectionStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: '600' },
  reconnectButton: { backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  reconnectText: { color: 'white', fontWeight: '600' },
  driverStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 12, marginBottom: 16 },
  statusLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  statusValueContainer: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { fontSize: 16, marginRight: 8 },
  statusValue: { fontSize: 16, fontWeight: 'bold' },
  locationDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 12, borderRadius: 12 },
  locationIcon: { fontSize: 16, marginRight: 12 },
  locationInfo: { flex: 1 },
  locationText: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 2 },
  actionsContainer: { marginHorizontal: 16, marginBottom: 16, gap: 12 },
  sosButton: { backgroundColor: '#DC2626', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  sosButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sosSubtext: { color: '#fca5a5', fontSize: 14, fontWeight: '500' },
  patientButton: { backgroundColor: '#0369A1', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  patientButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  patientSubtext: { color: '#93c5fd', fontSize: 14, fontWeight: '500' },
  callActionsContainer: { flexDirection: 'row', gap: 12 },
  callButton: { flex: 1, backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  callButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  endCallButton: { backgroundColor: '#991b1b', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  endCallButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  callsSection: { flex: 1, marginHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  callsContainer: { flex: 1 },
  noCallsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  noCallsIcon: { fontSize: 48, marginBottom: 16 },
  noCallsText: { fontSize: 18, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  noCallsSubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20, margin: 20, maxHeight: '85%', minWidth: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  closeButton: { fontSize: 24, color: '#64748b' },
  modalBody: { maxHeight: 500 },
  warningText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  locationConfirm: { backgroundColor: '#fef3c7', padding: 16, borderRadius: 12, marginBottom: 24 },
  locationLabel: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  locationValue: { fontSize: 16, color: '#78350f' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 20, marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  confirmButton: { flex: 1, backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  submitButton: { flex: 1, backgroundColor: '#0369A1', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
});

export default AmbulanceDashboard;