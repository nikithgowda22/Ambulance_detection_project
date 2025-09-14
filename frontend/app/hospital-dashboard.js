// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import WebSocketService from '../services/websocketService';

// const hospitaldashboard = () => {
//   const [patients, setPatients] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     // Connect to WebSocket when component mounts
//     WebSocketService.connect('hospital');
    
//     // Handle incoming messages
//     const handleMessage = (data) => {
//       if (data.type === 'patient_incoming') {
//         // Add new patient to the list
//         setPatients(prevPatients => [data, ...prevPatients]);
        
//         // Show immediate notification
//         Alert.alert(
//           'Patient Incoming',
//           data.message,
//           [{ text: 'OK' }]
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
//     WebSocketService.connect('hospital');
//   };

//   const goBack = () => {
//     router.back();
//   };

//   const markPatientReceived = (index) => {
//     setPatients(prevPatients => 
//       prevPatients.map((patient, i) => 
//         i === index ? { ...patient, status: 'received' } : patient
//       )
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={goBack} style={styles.backButton}>
//           <Text style={styles.backButtonText}>← Back</Text>
//         </TouchableOpacity>
//         <Text style={styles.title}>Hospital Dashboard</Text>
//       </View>
      
//       <View style={styles.connectionStatus}>
//         <Text style={isConnected ? styles.connected : styles.disconnected}>
//           {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
//         </Text>
//         {!isConnected && (
//           <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
//             <Text style={styles.reconnectButtonText}>Reconnect</Text>
//           </TouchableOpacity>
//         )}
//       </View>
      
//       <Text style={styles.subtitle}>Incoming Patients:</Text>
      
//       <ScrollView style={styles.patientsContainer}>
//         {patients.length === 0 ? (
//           <View style={styles.noPatientsContainer}>
//             <Text style={styles.noPatients}>No incoming patients</Text>
//             <Text style={styles.noPatientsSubtext}>Patient alerts will appear here</Text>
//           </View>
//         ) : (
//           patients.map((patient, index) => (
//             <View key={index} style={styles.patientCard}>
//               <View style={styles.patientInfo}>
//                 <Text style={styles.patientMessage}>{patient.message}</Text>
//                 <Text style={styles.patientTime}>
//                   {new Date(patient.timestamp).toLocaleTimeString()}
//                 </Text>
//               </View>
//               <View style={styles.patientActions}>
//                 <Text style={[
//                   styles.statusText,
//                   patient.status === 'received' ? styles.receivedStatus : styles.incomingStatus
//                 ]}>
//                   {patient.status === 'received' ? 'Received' : 'Incoming'}
//                 </Text>
//                 {patient.status !== 'received' && (
//                   <TouchableOpacity 
//                     style={styles.receiveButton}
//                     onPress={() => markPatientReceived(index)}
//                   >
//                     <Text style={styles.receiveButtonText}>Mark Received</Text>
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
//     color: '#e74c3c',
//     fontWeight: '600',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     flex: 1,
//   },
//   connectionStatus: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
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
//     backgroundColor: '#e74c3c',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   reconnectButtonText: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   subtitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginBottom: 12,
//     color: '#34495e',
//   },
//   patientsContainer: {
//     flex: 1,
//   },
//   noPatientsContainer: {
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   noPatients: {
//     textAlign: 'center',
//     color: '#7f8c8d',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   noPatientsSubtext: {
//     textAlign: 'center',
//     color: '#bdc3c7',
//     fontSize: 14,
//     marginTop: 8,
//   },
//   patientCard: {
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
//     borderLeftColor: '#e74c3c',
//   },
//   patientInfo: {
//     marginBottom: 12,
//   },
//   patientMessage: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   patientTime: {
//     fontSize: 12,
//     color: '#7f8c8d',
//   },
//   patientActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   statusText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   incomingStatus: {
//     color: '#f39c12',
//   },
//   receivedStatus: {
//     color: '#27ae60',
//   },
//   receiveButton: {
//     backgroundColor: '#27ae60',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   receiveButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
// });

// export default hospitaldashboard;
// app/hospital-dashboard.js
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
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import WebSocketService from '../services/websocketService';

const HospitalDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [incomingAmbulances, setIncomingAmbulances] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    WebSocketService.connect('hospital');
    
    const handleMessage = (data) => {
      console.log('Hospital received:', data);
      
      if (data.type === 'patient_incoming') {
        // Detailed patient information from ambulance
        setPatients(prevPatients => [data, ...prevPatients]);
        
        Alert.alert(
          '🏥 Patient Incoming',
          `${data.message}\nETA: ${data.eta || 'Unknown'}\nCondition: ${data.patientCondition || 'Stable'}`,
          [
            { text: 'Prepare Room', onPress: () => prepareRoom(data) },
            { text: 'View Details', onPress: () => showPatientDetails(data) }
          ]
        );
      } else if (data.type === 'ambulance_notification') {
        // Ambulance transport notifications
        setIncomingAmbulances(prevAmb => [data, ...prevAmb]);
        
        Alert.alert(
          '🚑 Ambulance En Route',
          `${data.message}\nETA: ${data.eta || '10 minutes'}`,
          [{ text: 'Prepare Emergency Team', style: 'default' }]
        );
      } else if (data.type === 'patient_details') {
        // Detailed patient information with vitals
        const updatedPatient = {
          ...data,
          vitals: data.vitals || {},
          medicalHistory: data.medicalHistory || 'Unknown',
          allergies: data.allergies || 'None reported'
        };
        
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p.id === data.patientId ? { ...p, ...updatedPatient } : p
          )
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

  const prepareRoom = (patient) => {
    // Send room preparation confirmation
    WebSocketService.sendMessage({
      type: 'room_prepared',
      patientId: patient.id,
      roomNumber: Math.floor(Math.random() * 100) + 1,
      preparationTeam: 'Emergency Team Alpha',
      message: 'Emergency room prepared for incoming patient',
      timestamp: new Date().toISOString()
    });

    // Update patient status
    setPatients(prevPatients => 
      prevPatients.map(p => 
        p.id === patient.id ? { ...p, status: 'room_prepared' } : p
      )
    );

    Alert.alert('Room Prepared', 'Emergency team has been notified and room is ready');
  };

  const showPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  const handleReconnect = () => {
    WebSocketService.connect('hospital');
  };

  const goBack = () => {
    router.back();
  };

  const markPatientReceived = (patientId) => {
    setPatients(prevPatients => 
      prevPatients.map(p => 
        p.id === patientId ? { ...p, status: 'received' } : p
      )
    );

    // Notify ambulance that patient has been received
    WebSocketService.sendMessage({
      type: 'patient_received_confirmation',
      patientId: patientId,
      message: 'Patient successfully transferred to hospital care',
      timestamp: new Date().toISOString()
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPatientPriority = (condition) => {
    if (!condition) return 'MEDIUM';
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('critical') || lowerCondition.includes('severe')) {
      return 'CRITICAL';
    } else if (lowerCondition.includes('serious') || lowerCondition.includes('urgent')) {
      return 'HIGH';
    }
    return 'MEDIUM';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#EA580C';
      case 'MEDIUM': return '#CA8A04';
      default: return '#0369A1';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return '#10B981';
      case 'room_prepared': return '#3B82F6';
      case 'incoming': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏥 Hospital Emergency Center</Text>
          <Text style={styles.subtitle}>Patient Management System</Text>
        </View>
      </View>
      
      {/* Connection & Stats */}
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
              {isConnected ? 'Emergency System Online' : 'Connection Lost'}
            </Text>
          </View>
          
          {!isConnected && (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
              <Text style={styles.reconnectText}>Reconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{patients.length}</Text>
            <Text style={styles.statLabel}>Incoming Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {patients.filter(p => getPatientPriority(p.patientCondition) === 'CRITICAL').length}
            </Text>
            <Text style={styles.statLabel}>Critical Cases</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {patients.filter(p => p.status === 'room_prepared').length}
            </Text>
            <Text style={styles.statLabel}>Rooms Ready</Text>
          </View>
        </View>
      </View>
      
      {/* Patients Section */}
      <View style={styles.patientsSection}>
        <Text style={styles.sectionTitle}>Emergency Patients</Text>
        
        <ScrollView 
          style={styles.patientsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {patients.length === 0 ? (
            <View style={styles.noPatientsContainer}>
              <Text style={styles.noPatientsIcon}>🏥</Text>
              <Text style={styles.noPatientsText}>No incoming patients</Text>
              <Text style={styles.noPatientsSubtext}>Patient alerts will appear here</Text>
            </View>
          ) : (
            patients.map((patient, index) => {
              const priority = getPatientPriority(patient.patientCondition);
              return (
                <TouchableOpacity 
                  key={patient.id || index} 
                  style={[
                    styles.patientCard,
                    { borderLeftColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => showPatientDetails(patient)}
                >
                  <View style={styles.patientHeader}>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(priority) }
                    ]}>
                      <Text style={styles.priorityText}>{priority}</Text>
                    </View>
                    <Text style={styles.patientTime}>
                      {new Date(patient.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>

                  <View style={styles.patientInfo}>
                    <Text style={styles.patientMessage}>{patient.message}</Text>
                    {patient.eta && (
                      <Text style={styles.etaText}>ETA: {patient.eta}</Text>
                    )}
                    {patient.patientCondition && (
                      <Text style={styles.conditionText}>
                        Condition: {patient.patientCondition}
                      </Text>
                    )}
                    {patient.location && (
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.locationText}>{patient.location.address}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.patientActions}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(patient.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(patient.status) }
                      ]}>
                        {patient.status || 'Incoming'}
                      </Text>
                    </View>
                    
                    {patient.status !== 'received' && (
                      <View style={styles.actionButtons}>
                        {patient.status !== 'room_prepared' && (
                          <TouchableOpacity 
                            style={styles.prepareButton}
                            onPress={() => prepareRoom(patient)}
                          >
                            <Text style={styles.prepareButtonText}>Prepare Room</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.receiveButton}
                          onPress={() => markPatientReceived(patient.id)}
                        >
                          <Text style={styles.receiveButtonText}>Mark Received</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Patient Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPatient && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Condition:</Text>
                <Text style={[
                  styles.modalValue,
                  { color: getPriorityColor(getPatientPriority(selectedPatient.patientCondition)) }
                ]}>
                  {selectedPatient.patientCondition || 'Stable'}
                </Text>
                
                <Text style={styles.modalLabel}>ETA:</Text>
                <Text style={styles.modalValue}>{selectedPatient.eta || 'Unknown'}</Text>
                
                <Text style={styles.modalLabel}>Message:</Text>
                <Text style={styles.modalValue}>{selectedPatient.message}</Text>
                
                <Text style={styles.modalLabel}>Time:</Text>
                <Text style={styles.modalValue}>
                  {new Date(selectedPatient.timestamp).toLocaleString()}
                </Text>
                
                {selectedPatient.vitals && (
                  <>
                    <Text style={styles.modalLabel}>Vitals:</Text>
                    <View style={styles.vitalsContainer}>
                      <Text style={styles.vitalItem}>
                        💓 HR: {selectedPatient.vitals.heartRate || 'N/A'} bpm
                      </Text>
                      <Text style={styles.vitalItem}>
                        🩸 BP: {selectedPatient.vitals.bloodPressure || 'N/A'}
                      </Text>
                      <Text style={styles.vitalItem}>
                        🌡️ Temp: {selectedPatient.vitals.temperature || 'N/A'}°C
                      </Text>
                    </View>
                  </>
                )}
                
                {selectedPatient.allergies && (
                  <>
                    <Text style={styles.modalLabel}>Allergies:</Text>
                    <Text style={styles.modalValue}>{selectedPatient.allergies}</Text>
                  </>
                )}
                
                {selectedPatient.medicalHistory && (
                  <>
                    <Text style={styles.modalLabel}>Medical History:</Text>
                    <Text style={styles.modalValue}>{selectedPatient.medicalHistory}</Text>
                  </>
                )}
              </ScrollView>
            )}
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
    backgroundColor: '#DC2626',
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
    color: '#fecaca',
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
    marginBottom: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  patientsSection: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  patientsContainer: {
    flex: 1,
  },
  noPatientsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noPatientsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noPatientsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  noPatientsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  patientCard: {
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
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patientTime: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  patientInfo: {
    marginBottom: 16,
  },
  patientMessage: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 8,
  },
  etaText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  patientActions: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  prepareButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  prepareButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  receiveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  receiveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 8,
  },
  vitalsContainer: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  vitalItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
});

export default HospitalDashboard;