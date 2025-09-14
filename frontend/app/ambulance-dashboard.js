// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import WebSocketService from '../services/websocketService';

// const ambulancedashboard = () => {
//   const [emergencyCalls, setEmergencyCalls] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [currentStatus, setCurrentStatus] = useState('available'); // available, responding, busy
//   const router = useRouter();

//   useEffect(() => {
//     // Connect to WebSocket when component mounts
//     WebSocketService.connect('ambulance');
    
//     // Handle incoming messages
//     const handleMessage = (data) => {
//       if (data.type === 'emergency_call') {
//         // Add new emergency call to the list
//         setEmergencyCalls(prevCalls => [data, ...prevCalls]);
        
//         // Show immediate notification
//         Alert.alert(
//           'Emergency Call',
//           data.message,
//           [
//             { text: 'Ignore', style: 'cancel' },
//             { text: 'Respond', onPress: () => respondToCall(data) }
//           ]
//         );
//       }
//     };
    
//     // Handle connection status changes
//     const checkConnection = setInterval(() => {
//       setIsConnected(WebSocketService.isConnected);
//     }, 1000);
    
//     WebSocketService.addMessageHandler(handleMessage);
    
//     // Clean up on component unmount
//     return () => {
//       WebSocketService.removeMessageHandler(handleMessage);
//       WebSocketService.disconnect();
//       clearInterval(checkConnection);
//     };
//   }, []);

//   const handleReconnect = () => {
//     WebSocketService.connect('ambulance');
//   };

//   const goBack = () => {
//     router.back();
//   };

//   const respondToCall = (call) => {
//     setCurrentStatus('responding');
//     // Update the call status
//     setEmergencyCalls(prevCalls => 
//       prevCalls.map(c => 
//         c.id === call.id ? { ...c, status: 'responding' } : c
//       )
//     );
    
//     // Send response to server
//     WebSocketService.sendMessage({
//       type: 'ambulance_response',
//       callId: call.id,
//       status: 'responding'
//     });
//   };

//   const completeCall = (callId) => {
//     setCurrentStatus('available');
//     // Update the call status
//     setEmergencyCalls(prevCalls => 
//       prevCalls.map(c => 
//         c.id === callId ? { ...c, status: 'completed' } : c
//       )
//     );
    
//     // Send completion to server
//     WebSocketService.sendMessage({
//       type: 'call_completed',
//       callId: callId
//     });
//   };

//   const sendAlert = () => {
//     // Send alert to police and hospital
//     WebSocketService.sendMessage({
//       type: 'ambulance_alert',
//       message: `Ambulance en route to hospital with patient - ETA 10 minutes`,
//       timestamp: new Date().toISOString()
//     });
    
//     Alert.alert(
//       'Alert Sent',
//       'Police and Hospital have been notified',
//       [{ text: 'OK' }]
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={goBack} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>Ambulance Driver</Text>
//       </View>
      
//       <View style={styles.statusContainer}>
//         <View style={styles.connectionStatus}>
//           <Text style={isConnected ? styles.connected : styles.disconnected}>
//             {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
//           </Text>
//           {!isConnected && (
//             <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
//               <Text style={styles.reconnectButtonText}>Reconnect</Text>
//             </TouchableOpacity>
//           )}
//         </View>
        
//         <View style={styles.driverStatus}>
//           <Text style={styles.statusLabel}>Status:</Text>
//           <Text style={[
//             styles.statusValue,
//             currentStatus === 'available' ? styles.availableStatus :
//             currentStatus === 'responding' ? styles.respondingStatus : styles.busyStatus
//           ]}>
//             {currentStatus.toUpperCase()}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.actionsContainer}>
//         <TouchableOpacity 
//           style={styles.alertButton}
//           onPress={sendAlert}
//           disabled={currentStatus === 'available'}
//         >
//           <Text style={styles.alertButtonText}>🚨 Send Alert to Police & Hospital</Text>
//         </TouchableOpacity>
//       </View>
      
//       <Text style={styles.subtitle}>Emergency Calls:</Text>
      
//       <ScrollView style={styles.callsContainer}>
//         {emergencyCalls.length === 0 ? (
//           <View style={styles.noCallsContainer}>
//             <Text style={styles.noCalls}>No emergency calls</Text>
//             <Text style={styles.noCallsSubtext}>Emergency calls will appear here</Text>
//           </View>
//         ) : (
//           emergencyCalls.map((call, index) => (
//             <View key={index} style={styles.callCard}>
//               <View style={styles.callInfo}>
//                 <Text style={styles.callMessage}>{call.message}</Text>
//                 <Text style={styles.callTime}>
//                   {new Date(call.timestamp).toLocaleTimeString()}
//                 </Text>
//               </View>
//               <View style={styles.callActions}>
//                 <Text style={[
//                   styles.callStatusText,
//                   call.status === 'completed' ? styles.completedStatus :
//                   call.status === 'responding' ? styles.respondingCallStatus : styles.pendingStatus
//                 ]}>
//                   {call.status || 'Pending'}
//                 </Text>
//                 {call.status === 'responding' && (
//                   <TouchableOpacity 
//                     style={styles.completeButton}
//                     onPress={() => completeCall(call.id)}
//                   >
//                     <Text style={styles.completeButtonText}>Complete</Text>
//                   </TouchableOpacity>
//                 )}
//                 {!call.status && (
//                   <TouchableOpacity 
//                     style={styles.respondButton}
//                     onPress={() => respondToCall(call)}
//                   >
//                     <Text style={styles.respondButtonText}>Respond</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             </View>
//           ))
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f5f5f5',
//     paddingTop: 50,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   backButton: {
//     marginRight: 16,
//     padding: 8,
//   },
//   backButtonText: {
//     fontSize: 16,
//     color: '#f39c12',
//     fontWeight: '600',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     flex: 1,
//   },
//   statusContainer: {
//     marginBottom: 16,
//   },
//   connectionStatus: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//     padding: 12,
//     backgroundColor: 'white',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   connected: {
//     color: '#27ae60',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   disconnected: {
//     color: '#e74c3c',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   reconnectButton: {
//     backgroundColor: '#f39c12',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   reconnectButtonText: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   driverStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     backgroundColor: 'white',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   statusLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#34495e',
//     marginRight: 12,
//   },
//   statusValue: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   availableStatus: {
//     color: '#27ae60',
//   },
//   respondingStatus: {
//     color: '#f39c12',
//   },
//   busyStatus: {
//     color: '#e74c3c',
//   },
//   actionsContainer: {
//     marginBottom: 16,
//   },
//   alertButton: {
//     backgroundColor: '#e74c3c',
//     padding: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   alertButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   subtitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//     color: '#34495e',
//   },
//   callsContainer: {
//     flex: 1,
//   },
//   noCallsContainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   noCalls: {
//     textAlign: 'center',
//     color: '#7f8c8d',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   noCallsSubtext: {
//     textAlign: 'center',
//     color: '#bdc3c7',
//     fontSize: 14,
//     marginTop: 8,
//   },
//   callCard: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//     borderLeftWidth: 4,
//     borderLeftColor: '#f39c12',
//   },
//   callInfo: {
//     marginBottom: 12,
//   },
//   callMessage: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   callTime: {
//     fontSize: 12,
//     color: '#7f8c8d',
//   },
//   callActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   callStatusText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   pendingStatus: {
//     color: '#95a5a6',
//   },
//   respondingCallStatus: {
//     color: '#f39c12',
//   },
//   completedStatus: {
//     color: '#27ae60',
//   },
//   respondButton: {
//     backgroundColor: '#f39c12',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   respondButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   completeButton: {
//     backgroundColor: '#27ae60',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   completeButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   });

// export default ambulancedashboard;

// app/ambulance-dashboard.js
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
    
    // Get current location on component mount
    getCurrentLocation();
    
    const handleMessage = (data) => {
      console.log('Ambulance received:', data);
      
      if (data.type === 'emergency_call') {
        setEmergencyCalls(prevCalls => [data, ...prevCalls]);
        
        Alert.alert(
          '🚨 Emergency Call',
          `${data.message}\nLocation: ${data.location?.address || 'Unknown'}`,
          [
            { text: 'Ignore', style: 'cancel' },
            { text: 'Respond', onPress: () => respondToCall(data) }
          ]
        );
      } else if (data.type === 'police_response') {
        Alert.alert(
          '👮‍♂️ Police Response',
          data.message,
          [{ text: 'OK' }]
        );
      } else if (data.type === 'room_prepared') {
        Alert.alert(
          '🏥 Hospital Ready',
          `Room ${data.roomNumber} prepared by ${data.preparationTeam}`,
          [{ text: 'Acknowledged' }]
        );
      }
    };
    
    const checkConnection = setInterval(() => {
      setIsConnected(WebSocketService.isConnected);
    }, 1000);
    
    WebSocketService.addMessageHandler(handleMessage);
    
    return () => {
      WebSocketService.removeMessageHandler(handleMessage);
      WebSocketService.disconnect();
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
    await getCurrentLocation(); // Get fresh location
    
    if (!currentLocation) {
      Alert.alert('Location Error', 'Unable to get current location. Please try again.');
      return;
    }

    // Send SOS alert to police with location
    WebSocketService.sendMessage({
      type: 'emergency_alert',
      id: Date.now().toString(),
      message: `🚨 AMBULANCE SOS ALERT - Immediate assistance required at current location`,
      location: currentLocation,
      ambulanceId: 'AMB-001',
      status: 'critical',
      timestamp: new Date().toISOString()
    });

    setSosModalVisible(false);
    setCurrentStatus('emergency');
    
    Alert.alert(
      'SOS Alert Sent!',
      `Police have been notified of your emergency at:\n${currentLocation.address}`,
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

    // Send detailed patient information to hospital
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

    // Also send notification to police
    WebSocketService.sendMessage({
      type: 'ambulance_notification',
      message: `Ambulance transporting ${patientInfo.condition} patient to hospital`,
      eta: patientInfo.eta,
      destination: 'Emergency Hospital',
      timestamp: new Date().toISOString()
    });

    setPatientModalVisible(false);
    setCurrentStatus('en_route');
    
    // Clear form
    setPatientInfo({
      condition: '',
      vitals: { heartRate: '', bloodPressure: '', temperature: '' },
      allergies: '',
      medicalHistory: '',
      eta: ''
    });

    Alert.alert(
      'Patient Info Sent',
      'Hospital and police have been notified with patient details',
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

        {/* Location Display */}
        {currentLocation && (
          <View style={styles.locationDisplay}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{currentLocation.address}</Text>
              <Text style={styles.coordinatesText}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Emergency Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.sosButton, currentStatus === 'available' && styles.disabledButton]}
          onPress={sendSOSAlert}
          disabled={currentStatus === 'available'}
        >
          <Text style={styles.sosButtonText}>🚨 EMERGENCY SOS</Text>
          <Text style={styles.sosSubtext}>Alert Police to Location</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.patientButton, currentStatus === 'available' && styles.disabledButton]}
          onPress={sendPatientInfo}
          disabled={currentStatus === 'available'}
        >
          <Text style={styles.patientButtonText}>🏥 Send Patient Info</Text>
          <Text style={styles.patientSubtext}>Notify Hospital & Police</Text>
        </TouchableOpacity>
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
                <View style={styles.callHeader}>
                  <Text style={styles.callIcon}>🚨</Text>
                  <Text style={styles.callTime}>
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.callInfo}>
                  <Text style={styles.callMessage}>{call.message}</Text>
                  {call.location && (
                    <View style={styles.callLocationContainer}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.callLocationText}>{call.location.address}</Text>
                    </View>
                  )}
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
                This will send an immediate emergency alert to all police units with your current location.
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
                  <Text style={styles.confirmButtonText}>SEND SOS</Text>
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
                onChangeText={(text) => setPatientInfo(prev => ({...prev, condition: text}))}
                placeholder="e.g., Critical, Stable, Serious"
              />

              <Text style={styles.inputLabel}>ETA to Hospital *</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.eta}
                onChangeText={(text) => setPatientInfo(prev => ({...prev, eta: text}))}
                placeholder="e.g., 10 minutes, 15-20 minutes"
              />

              <Text style={styles.sectionLabel}>Vitals (Optional)</Text>
              
              <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.heartRate}
                onChangeText={(text) => setPatientInfo(prev => ({
                  ...prev, 
                  vitals: {...prev.vitals, heartRate: text}
                }))}
                placeholder="e.g., 80"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Blood Pressure</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.bloodPressure}
                onChangeText={(text) => setPatientInfo(prev => ({
                  ...prev, 
                  vitals: {...prev.vitals, bloodPressure: text}
                }))}
                placeholder="e.g., 120/80"
              />

              <Text style={styles.inputLabel}>Temperature (°C)</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.vitals.temperature}
                onChangeText={(text) => setPatientInfo(prev => ({
                  ...prev, 
                  vitals: {...prev.vitals, temperature: text}
                }))}
                placeholder="e.g., 36.5"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Allergies</Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.allergies}
                onChangeText={(text) => setPatientInfo(prev => ({...prev, allergies: text}))}
                placeholder="Known allergies or 'None'"
              />

              <Text style={styles.inputLabel}>Medical History</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={patientInfo.medicalHistory}
                onChangeText={(text) => setPatientInfo(prev => ({...prev, medicalHistory: text}))}
                placeholder="Relevant medical history"
                multiline
                numberOfLines={3}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#F59E0B',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginTop: 25,
  },
  backButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fef3c7',
    opacity: 0.9,
  },
  statusContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reconnectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reconnectText: {
    color: 'white',
    fontWeight: '600',
  },
  driverStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#a16207',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  sosButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sosSubtext: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '500',
  },
  patientButton: {
    backgroundColor: '#0369A1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientSubtext: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  callsSection: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  callsContainer: {
    flex: 1,
  },
  noCallsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCallsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noCallsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  noCallsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  callCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  callIcon: {
    fontSize: 20,
  },
  callTime: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callInfo: {
    marginBottom: 16,
  },
  callMessage: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 8,
  },
  callLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
  },
  callLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
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
    color: '#6b7280',
  },
  respondingCallStatus: {
    color: '#f59e0b',
  },
  completedStatus: {
    color: '#10b981',
  },
  respondButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  respondButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '85%',
    minWidth: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
  },
  modalBody: {
    maxHeight: 500,
  },
  warningText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  locationConfirm: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#78350f',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#0369A1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AmbulanceDashboard;