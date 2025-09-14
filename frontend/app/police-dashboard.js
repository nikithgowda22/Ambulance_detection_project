// // app/police-dashboard.js
// import React, { useState, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   ScrollView, 
//   Alert, 
//   TouchableOpacity,
//   StatusBar,
//   RefreshControl,
//   Linking,
//   Modal
// } from 'react-native';
// import WebSocketService from '../services/websocketService';

// const PoliceDashboard = () => {
//   const [emergencyAlerts, setEmergencyAlerts] = useState([]);
//   const [ambulanceAlerts, setAmbulanceAlerts] = useState([]);
//   const [activeAmbulances, setActiveAmbulances] = useState([]);
//   const [ambulanceHistory, setAmbulanceHistory] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedAlert, setSelectedAlert] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [historyModalVisible, setHistoryModalVisible] = useState(false);

//   useEffect(() => {
//     WebSocketService.connect('police');
    
//     const handleMessage = (data) => {
//       console.log('Police received:', data);
      
//       if (data.type === 'emergency_alert') {
//         // Check if it's an ambulance detection alert
//         if (data.message.includes('AMBULANCE DETECTED')) {
//           // Add to active ambulances
//           const ambulanceData = {
//             id: data.ambulanceId || data.id,
//             detectedAt: data.timestamp,
//             location: data.location,
//             status: 'active',
//             priority: data.priority || 'HIGH',
//             message: data.message
//           };
          
//           setActiveAmbulances(prevActive => {
//             const exists = prevActive.some(amb => amb.id === ambulanceData.id);
//             if (!exists) {
//               return [ambulanceData, ...prevActive];
//             }
//             return prevActive;
//           });

//           // Show priority alert for ambulance detection
//           Alert.alert(
//             '🚨 AMBULANCE DETECTED IN VIDEO',
//             `Location: ${data.location?.address || 'Unknown'}\n\nAmbulance requesting green corridor clearance`,
//             [
//               { text: 'Dismiss', style: 'cancel' },
//               { text: 'Clear Path', onPress: () => clearAmbulancePath(ambulanceData) },
//               { text: 'View Location', onPress: () => openLocationMap(data.location) }
//             ]
//           );
//         } else {
//           // Regular emergency alerts
//           setEmergencyAlerts(prevAlerts => [data, ...prevAlerts.slice(0, 9)]);
          
//           Alert.alert(
//             '🚨 EMERGENCY SOS ALERT',
//             `Location: ${data.location?.address || 'Unknown'}\n\n${data.message}`,
//             [
//               { text: 'Dismiss', style: 'cancel' },
//               { text: 'Respond', onPress: () => respondToEmergency(data) },
//               { text: 'View Map', onPress: () => openLocationMap(data.location) }
//             ]
//           );
//         }
//       } else if (data.type === 'ambulance_notification') {
//         // Hospital transport notifications
//         setAmbulanceAlerts(prevAlerts => [data, ...prevAlerts.slice(0, 9)]);
        
//         Alert.alert(
//           '🚑 Ambulance Alert',
//           `${data.message}\nETA: ${data.eta || 'Unknown'}`,
//           [{ text: 'Acknowledged', style: 'default' }]
//         );
//       } else if (data.type === 'ambulance_status_update') {
//         // Update ambulance status
//         if (data.status === 'passed') {
//           // Move from active to history
//           setActiveAmbulances(prevActive => 
//             prevActive.filter(amb => amb.id !== data.ambulanceId)
//           );
          
//           // Refresh history (in real app, you might fetch from server)
//           fetchAmbulanceHistory();
//         }
//       }
//     };
    
//     const checkConnection = setInterval(() => {
//       setIsConnected(WebSocketService.isConnected);
//     }, 1000);
    
//     WebSocketService.addMessageHandler(handleMessage);
    
//     return () => {
//       WebSocketService.removeMessageHandler(handleMessage);
//       WebSocketService.disconnect();
//       clearInterval(checkConnection);
//     };
//   }, []);

//   const clearAmbulancePath = (ambulanceData) => {
//     // Update ambulance status to "path_cleared"
//     setActiveAmbulances(prevActive =>
//       prevActive.map(amb => 
//         amb.id === ambulanceData.id 
//           ? { ...amb, status: 'path_cleared', clearedAt: new Date().toISOString() }
//           : amb
//       )
//     );

//     // Send acknowledgment to backend
//     WebSocketService.sendMessage({
//       type: 'path_cleared',
//       ambulanceId: ambulanceData.id,
//       message: 'Green corridor cleared by police',
//       timestamp: new Date().toISOString()
//     });

//     Alert.alert(
//       '✅ Path Cleared', 
//       `Green corridor cleared for ambulance at ${ambulanceData.location?.address}.\n\nPress "Ambulance Passed" when the ambulance has passed through.`,
//       [{ text: 'OK' }]
//     );
//   };

//   const markAmbulancePassed = (ambulanceData) => {
//     Alert.alert(
//       'Confirm Ambulance Passed',
//       `Mark ambulance at ${ambulanceData.location?.address} as passed?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Confirm Passed', 
//           onPress: () => {
//             // Send message to backend
//             WebSocketService.sendMessage({
//               type: 'ambulance_passed',
//               ambulanceId: ambulanceData.id,
//               timestamp: new Date().toISOString()
//             });

//             // Move to history locally
//             const historyEntry = {
//               ...ambulanceData,
//               status: 'completed',
//               passedAt: new Date().toISOString()
//             };

//             setAmbulanceHistory(prev => [historyEntry, ...prev]);
//             setActiveAmbulances(prev => prev.filter(amb => amb.id !== ambulanceData.id));

//             Alert.alert('✅ Updated', 'Ambulance marked as passed and moved to history');
//           }
//         }
//       ]
//     );
//   };

//   const fetchAmbulanceHistory = async () => {
//     // In a real app, fetch from your backend API
//     // For now, we'll just use local state
//     console.log('Fetching ambulance history...');
//   };

//   const respondToEmergency = (alert) => {
//     WebSocketService.sendMessage({
//       type: 'police_response',
//       alertId: alert.id,
//       message: 'Police unit dispatched to your location',
//       status: 'responding',
//       timestamp: new Date().toISOString()
//     });

//     setEmergencyAlerts(prevAlerts =>
//       prevAlerts.map(a => 
//         a.id === alert.id ? { ...a, status: 'police_responding' } : a
//       )
//     );

//     Alert.alert('Response Sent', 'Emergency services have been notified');
//   };

//   const openLocationMap = (location) => {
//     if (location) {
//       const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
//       Linking.openURL(url).catch(err => console.error('Error opening map:', err));
//     }
//   };

//   const handleReconnect = () => {
//     WebSocketService.connect('police');
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchAmbulanceHistory();
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);
//   };

//   const showAlertDetails = (alert) => {
//     setSelectedAlert(alert);
//     setModalVisible(true);
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'active': return '#DC2626';
//       case 'path_cleared': return '#EA580C';
//       case 'completed': return '#059669';
//       default: return '#0369A1';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'active': return 'Needs Clearance';
//       case 'path_cleared': return 'Path Cleared';
//       case 'completed': return 'Completed';
//       default: return status;
//     }
//   };

//   const formatTime = (timestamp) => {
//     return new Date(timestamp).toLocaleTimeString();
//   };

//   const formatDate = (timestamp) => {
//     return new Date(timestamp).toLocaleDateString();
//   };

//   return (
//     <View style={styles.safeArea}>
//       <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <Text style={styles.title}>🚔 Police Command Center</Text>
//           <Text style={styles.subtitle}>Emergency & Ambulance Response</Text>
//         </View>
//       </View>

//       {/* Connection & Stats */}
//       <View style={styles.statusContainer}>
//         <View style={styles.connectionStatus}>
//           <View style={styles.statusIndicator}>
//             <View style={[
//               styles.statusDot, 
//               { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
//             ]} />
//             <Text style={[
//               styles.statusText,
//               { color: isConnected ? '#10B981' : '#EF4444' }
//             ]}>
//               {isConnected ? 'Command Center Online' : 'Connection Lost'}
//             </Text>
//           </View>
          
//           {!isConnected && (
//             <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
//               <Text style={styles.reconnectText}>Reconnect</Text>
//             </TouchableOpacity>
//           )}
//         </View>

//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{activeAmbulances.length}</Text>
//             <Text style={styles.statLabel}>Active Ambulances</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{emergencyAlerts.length}</Text>
//             <Text style={styles.statLabel}>SOS Alerts</Text>
//           </View>
//           <View style={styles.statCard}>
//             <Text style={styles.statNumber}>{ambulanceHistory.length}</Text>
//             <Text style={styles.statLabel}>Completed</Text>
//           </View>
//         </View>
//       </View>

//       {/* Active Ambulances Section */}
//       {activeAmbulances.length > 0 && (
//         <View style={styles.ambulanceSection}>
//           <Text style={styles.sectionTitle}>🚑 Active Ambulance Alerts</Text>
          
//           <ScrollView style={styles.ambulanceContainer} showsVerticalScrollIndicator={false}>
//             {activeAmbulances.map((ambulance) => (
//               <View 
//                 key={ambulance.id} 
//                 style={[styles.ambulanceCard, { borderLeftColor: getStatusColor(ambulance.status) }]}
//               >
//                 <View style={styles.ambulanceHeader}>
//                   <Text style={styles.ambulanceId}>🚨 ID: {ambulance.id}</Text>
//                   <View style={[
//                     styles.statusBadge,
//                     { backgroundColor: getStatusColor(ambulance.status) }
//                   ]}>
//                     <Text style={styles.statusBadgeText}>{getStatusText(ambulance.status)}</Text>
//                   </View>
//                 </View>
                
//                 <Text style={styles.ambulanceMessage}>{ambulance.message}</Text>
                
//                 <View style={styles.locationContainer}>
//                   <Text style={styles.locationIcon}>📍</Text>
//                   <Text style={styles.locationText}>{ambulance.location?.address}</Text>
//                 </View>
                
//                 <View style={styles.timeContainer}>
//                   <Text style={styles.timeLabel}>Detected: {formatTime(ambulance.detectedAt)}</Text>
//                   {ambulance.clearedAt && (
//                     <Text style={styles.timeLabel}>Cleared: {formatTime(ambulance.clearedAt)}</Text>
//                   )}
//                 </View>
                
//                 <View style={styles.ambulanceActions}>
//                   {ambulance.status === 'active' && (
//                     <TouchableOpacity 
//                       style={styles.clearPathButton}
//                       onPress={() => clearAmbulancePath(ambulance)}
//                     >
//                       <Text style={styles.actionButtonText}>🚦 Clear Path</Text>
//                     </TouchableOpacity>
//                   )}
//                   {ambulance.status === 'path_cleared' && (
//                     <TouchableOpacity 
//                       style={styles.passedButton}
//                       onPress={() => markAmbulancePassed(ambulance)}
//                     >
//                       <Text style={styles.actionButtonText}>✅ Ambulance Passed</Text>
//                     </TouchableOpacity>
//                   )}
//                   <TouchableOpacity 
//                     style={styles.mapButton}
//                     onPress={() => openLocationMap(ambulance.location)}
//                   >
//                     <Text style={styles.actionButtonText}>🗺️ View Map</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Emergency Alerts Section */}
//       <View style={styles.alertsSection}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>Emergency Alerts Feed</Text>
//           <TouchableOpacity 
//             style={styles.historyButton}
//             onPress={() => setHistoryModalVisible(true)}
//           >
//             <Text style={styles.historyButtonText}>📋 History</Text>
//           </TouchableOpacity>
//         </View>
        
//         <ScrollView 
//           style={styles.alertsContainer}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//           showsVerticalScrollIndicator={false}
//         >
//           {[...emergencyAlerts, ...ambulanceAlerts].length === 0 ? (
//             <View style={styles.noAlertsContainer}>
//               <Text style={styles.noAlertsIcon}>🛡️</Text>
//               <Text style={styles.noAlertsText}>All Systems Clear</Text>
//               <Text style={styles.noAlertsSubtext}>Monitoring all emergency channels</Text>
//             </View>
//           ) : (
//             [...emergencyAlerts, ...ambulanceAlerts]
//               .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
//               .map((alert, index) => (
//                 <TouchableOpacity 
//                   key={`alert-${index}`} 
//                   style={styles.alertCard}
//                   onPress={() => showAlertDetails(alert)}
//                 >
//                   <View style={styles.alertHeader}>
//                     <Text style={styles.alertIcon}>
//                       {alert.type === 'ambulance_notification' ? '🚑' : '🚨'}
//                     </Text>
//                     <Text style={styles.alertTime}>
//                       {formatTime(alert.timestamp)}
//                     </Text>
//                   </View>
                  
//                   <Text style={styles.alertMessage}>{alert.message}</Text>
                  
//                   {alert.location && (
//                     <View style={styles.locationContainer}>
//                       <Text style={styles.locationIcon}>📍</Text>
//                       <Text style={styles.locationText}>{alert.location.address}</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               ))
//           )}
//         </ScrollView>
//       </View>

//       {/* History Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={historyModalVisible}
//         onRequestClose={() => setHistoryModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Ambulance History</Text>
//               <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
//                 <Text style={styles.closeButton}>✕</Text>
//               </TouchableOpacity>
//             </View>
            
//             <ScrollView style={styles.historyList}>
//               {ambulanceHistory.length === 0 ? (
//                 <Text style={styles.noHistoryText}>No completed ambulance clearances yet</Text>
//               ) : (
//                 ambulanceHistory.map((entry, index) => (
//                   <View key={index} style={styles.historyItem}>
//                     <View style={styles.historyHeader}>
//                       <Text style={styles.historyId}>ID: {entry.id}</Text>
//                       <Text style={styles.historyDate}>{formatDate(entry.detectedAt)}</Text>
//                     </View>
//                     <Text style={styles.historyLocation}>📍 {entry.location?.address}</Text>
//                     <View style={styles.historyTimes}>
//                       <Text style={styles.historyTime}>
//                         Detected: {formatTime(entry.detectedAt)}
//                       </Text>
//                       {entry.clearedAt && (
//                         <Text style={styles.historyTime}>
//                           Cleared: {formatTime(entry.clearedAt)}
//                         </Text>
//                       )}
//                       {entry.passedAt && (
//                         <Text style={styles.historyTime}>
//                           Passed: {formatTime(entry.passedAt)}
//                         </Text>
//                       )}
//                     </View>
//                     <View style={styles.completedBadge}>
//                       <Text style={styles.completedBadgeText}>✅ Completed</Text>
//                     </View>
//                   </View>
//                 ))
//               )}
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       {/* Alert Details Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Alert Details</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 <Text style={styles.closeButton}>✕</Text>
//               </TouchableOpacity>
//             </View>
            
//             {selectedAlert && (
//               <ScrollView style={styles.modalBody}>
//                 <Text style={styles.modalLabel}>Type:</Text>
//                 <Text style={styles.modalValue}>{selectedAlert.type.replace('_', ' ').toUpperCase()}</Text>
                
//                 <Text style={styles.modalLabel}>Message:</Text>
//                 <Text style={styles.modalValue}>{selectedAlert.message}</Text>
                
//                 <Text style={styles.modalLabel}>Time:</Text>
//                 <Text style={styles.modalValue}>
//                   {new Date(selectedAlert.timestamp).toLocaleString()}
//                 </Text>
                
//                 {selectedAlert.location && (
//                   <>
//                     <Text style={styles.modalLabel}>Location:</Text>
//                     <Text style={styles.modalValue}>{selectedAlert.location.address}</Text>
//                     <Text style={styles.modalValue}>
//                       Lat: {selectedAlert.location.latitude}, Lng: {selectedAlert.location.longitude}
//                     </Text>
//                   </>
//                 )}
                
//                 {selectedAlert.eta && (
//                   <>
//                     <Text style={styles.modalLabel}>ETA:</Text>
//                     <Text style={styles.modalValue}>{selectedAlert.eta}</Text>
//                   </>
//                 )}
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   header: {
//     backgroundColor: '#1e3a8a',
//     paddingVertical: 20,
//     paddingHorizontal: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   headerContent: {
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 4,
//     marginTop: 25,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#bfdbfe',
//     opacity: 0.9,
//   },
//   statusContainer: {
//     backgroundColor: 'white',
//     margin: 16,
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   connectionStatus: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   statusIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 8,
//   },
//   statusText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   reconnectButton: {
//     backgroundColor: '#EF4444',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   reconnectText: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statCard: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 12,
//     marginHorizontal: 4,
//     backgroundColor: '#f1f5f9',
//     borderRadius: 12,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1e3a8a',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   ambulanceSection: {
//     marginHorizontal: 16,
//     marginBottom: 16,
//   },
//   ambulanceContainer: {
//     maxHeight: 300,
//   },
//   ambulanceCard: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//     borderLeftWidth: 6,
//   },
//   ambulanceHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   ambulanceId: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   ambulanceMessage: {
//     fontSize: 16,
//     color: '#374151',
//     marginBottom: 12,
//     fontWeight: '500',
//   },
//   timeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   timeLabel: {
//     fontSize: 12,
//     color: '#6b7280',
//     backgroundColor: '#f3f4f6',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   ambulanceActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   clearPathButton: {
//     flex: 1,
//     backgroundColor: '#dc2626',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   passedButton: {
//     flex: 1,
//     backgroundColor: '#059669',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   mapButton: {
//     backgroundColor: '#0369a1',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   alertsSection: {
//     flex: 1,
//     marginHorizontal: 16,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   historyButton: {
//     backgroundColor: '#6366f1',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   historyButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   alertsContainer: {
//     flex: 1,
//   },
//   noAlertsContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   noAlertsIcon: {
//     fontSize: 48,
//     marginBottom: 16,
//   },
//   noAlertsText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#64748b',
//     marginBottom: 8,
//   },
//   noAlertsSubtext: {
//     fontSize: 14,
//     color: '#94a3b8',
//     textAlign: 'center',
//   },
//   alertCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   alertHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   alertIcon: {
//     fontSize: 16,
//   },
//   alertTime: {
//     fontSize: 12,
//     color: '#6b7280',
//     backgroundColor: '#f3f4f6',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   alertMessage: {
//     fontSize: 14,
//     color: '#374151',
//     marginBottom: 8,
//   },
//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fef3c7',
//     padding: 8,
//     borderRadius: 6,
//   },
//   locationIcon: {
//     marginRight: 6,
//     fontSize: 12,
//   },
//   locationText: {
//     flex: 1,
//     fontSize: 12,
//     color: '#92400e',
//     fontWeight: '500',
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   statusBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//     margin: 20,
//     maxHeight: '80%',
//     minWidth: '90%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   closeButton: {
//     fontSize: 24,
//     color: '#64748b',
//   },
//   modalBody: {
//     maxHeight: 400,
//   },
//   modalLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     marginTop: 12,
//     marginBottom: 4,
//   },
//   modalValue: {
//     fontSize: 16,
//     color: '#1e293b',
//     marginBottom: 8,
//   },
//   historyList: {
//     maxHeight: 400,
//   },
//   noHistoryText: {
//     textAlign: 'center',
//     color: '#6b7280',
//     fontSize: 16,
//     marginTop: 40,
//   },
//   historyItem: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#059669',
//   },
//   historyHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   historyId: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#1e293b',
//   },
//   historyDate: {
//     fontSize: 12,
//     color: '#6b7280',
//   },
//   historyLocation: {
//     fontSize: 14,
//     color: '#374151',
//     marginBottom: 8,
//   },
//   historyTimes: {
//     marginBottom: 12,
//   },
//   historyTime: {
//     fontSize: 12,
//     color: '#6b7280',
//     marginBottom: 4,
//   },
//   completedBadge: {
//     backgroundColor: '#d1fae5',
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//   },
//   completedBadgeText: {
//     color: '#065f46',
//     fontSize: 12,
//     fontWeight: '600',
//   },
// });

// export default PoliceDashboard;

// app/police-dashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Linking,
  Modal
} from 'react-native';
import WebSocketService from '../services/websocketService';

const PoliceDashboard = () => {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [ambulanceAlerts, setAmbulanceAlerts] = useState([]);
  const [activeAmbulances, setActiveAmbulances] = useState([]);
  const [ambulanceHistory, setAmbulanceHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Fetch ambulance history from database
  const fetchAmbulanceHistory = async () => {
    try {
      const response = await fetch('http://192.168.1.4:8000/ambulance-history');
      const data = await response.json();
      setAmbulanceHistory(data.history);
      console.log('Fetched ambulance history:', data.history.length, 'records');
    } catch (error) {
      console.error('Error fetching ambulance history:', error);
    }
  };

  // Fetch active ambulances from database
  const fetchActiveAmbulances = async () => {
    try {
      const response = await fetch('http://192.168.1.4:8000/active-ambulances');
      const data = await response.json();
      
      // Convert database format to component format
      const formattedActive = data.active.map(ambulance => ({
        id: ambulance.id,
        detectedAt: ambulance.detectedAt,
        location: ambulance.location,
        status: ambulance.status,
        priority: ambulance.priority,
        clearedAt: ambulance.clearedAt,
        message: `🚨 AMBULANCE DETECTED - Requesting green corridor clearance`
      }));
      
      setActiveAmbulances(formattedActive);
      console.log('Fetched active ambulances:', formattedActive.length, 'records');
    } catch (error) {
      console.error('Error fetching active ambulances:', error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchAmbulanceHistory();
    fetchActiveAmbulances();
    
    WebSocketService.connect('police');
    
    const handleMessage = (data) => {
      console.log('Police received:', data);
      
      if (data.type === 'emergency_alert') {
        // Check if it's an ambulance detection alert
        if (data.message.includes('AMBULANCE DETECTED')) {
          // Add to active ambulances
          const ambulanceData = {
            id: data.ambulanceId || data.id,
            detectedAt: data.timestamp,
            location: data.location,
            status: 'active',
            priority: data.priority || 'HIGH',
            message: data.message
          };
          
          setActiveAmbulances(prevActive => {
            const exists = prevActive.some(amb => amb.id === ambulanceData.id);
            if (!exists) {
              return [ambulanceData, ...prevActive];
            }
            return prevActive;
          });

          // Show priority alert for ambulance detection
          Alert.alert(
            '🚨 AMBULANCE DETECTED IN VIDEO',
            `Location: ${data.location?.address || 'Unknown'}\n\nAmbulance requesting green corridor clearance`,
            [
              { text: 'Dismiss', style: 'cancel' },
              { text: 'Clear Path', onPress: () => clearAmbulancePath(ambulanceData) },
              { text: 'View Location', onPress: () => openLocationMap(data.location) }
            ]
          );
        } else {
          // Regular emergency alerts
          setEmergencyAlerts(prevAlerts => [data, ...prevAlerts.slice(0, 9)]);
          
          Alert.alert(
            '🚨 EMERGENCY SOS ALERT',
            `Location: ${data.location?.address || 'Unknown'}\n\n${data.message}`,
            [
              { text: 'Dismiss', style: 'cancel' },
              { text: 'Respond', onPress: () => respondToEmergency(data) },
              { text: 'View Map', onPress: () => openLocationMap(data.location) }
            ]
          );
        }
      } else if (data.type === 'ambulance_notification') {
        // Hospital transport notifications
        setAmbulanceAlerts(prevAlerts => [data, ...prevAlerts.slice(0, 9)]);
        
        Alert.alert(
          '🚑 Ambulance Alert',
          `${data.message}\nETA: ${data.eta || 'Unknown'}`,
          [{ text: 'Acknowledged', style: 'default' }]
        );
      } else if (data.type === 'ambulance_status_update') {
        // Update ambulance status
        if (data.status === 'passed') {
          // Move from active to history
          setActiveAmbulances(prevActive => 
            prevActive.filter(amb => amb.id !== data.ambulanceId)
          );
          
          // Refresh history from database
          fetchAmbulanceHistory();
        }
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

  const clearAmbulancePath = (ambulanceData) => {
    // Update ambulance status to "path_cleared"
    setActiveAmbulances(prevActive =>
      prevActive.map(amb => 
        amb.id === ambulanceData.id 
          ? { ...amb, status: 'path_cleared', clearedAt: new Date().toISOString() }
          : amb
      )
    );

    // Send acknowledgment to backend
    WebSocketService.sendMessage({
      type: 'path_cleared',
      ambulanceId: ambulanceData.id,
      message: 'Green corridor cleared by police',
      timestamp: new Date().toISOString()
    });

    Alert.alert(
      '✅ Path Cleared', 
      `Green corridor cleared for ambulance at ${ambulanceData.location?.address}.\n\nPress "Ambulance Passed" when the ambulance has passed through.`,
      [{ text: 'OK' }]
    );
  };

  const markAmbulancePassed = (ambulanceData) => {
    Alert.alert(
      'Confirm Ambulance Passed',
      `Mark ambulance at ${ambulanceData.location?.address} as passed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Passed', 
          onPress: () => {
            // Send message to backend
            WebSocketService.sendMessage({
              type: 'ambulance_passed',
              ambulanceId: ambulanceData.id,
              timestamp: new Date().toISOString()
            });

            // Remove from local active list
            setActiveAmbulances(prev => prev.filter(amb => amb.id !== ambulanceData.id));

            // Refresh history from database
            fetchAmbulanceHistory();

            Alert.alert('✅ Updated', 'Ambulance marked as passed and moved to history');
          }
        }
      ]
    );
  };

  const respondToEmergency = (alert) => {
    WebSocketService.sendMessage({
      type: 'police_response',
      alertId: alert.id,
      message: 'Police unit dispatched to your location',
      status: 'responding',
      timestamp: new Date().toISOString()
    });

    setEmergencyAlerts(prevAlerts =>
      prevAlerts.map(a => 
        a.id === alert.id ? { ...a, status: 'police_responding' } : a
      )
    );

    Alert.alert('Response Sent', 'Emergency services have been notified');
  };

  const openLocationMap = (location) => {
    if (location) {
      const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      Linking.openURL(url).catch(err => console.error('Error opening map:', err));
    }
  };

  const handleReconnect = () => {
    WebSocketService.connect('police');
    // Refresh data when reconnecting
    fetchAmbulanceHistory();
    fetchActiveAmbulances();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAmbulanceHistory(),
        fetchActiveAmbulances()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  };

  const showAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'detected': 
        return '#DC2626';
      case 'path_cleared': 
        return '#EA580C';
      case 'completed':
      case 'passed': 
        return '#059669';
      default: 
        return '#0369A1';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
      case 'detected': 
        return 'Needs Clearance';
      case 'path_cleared': 
        return 'Path Cleared';
      case 'completed':
      case 'passed': 
        return 'Completed';
      default: 
        return status;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🚔 Police Command Center</Text>
          <Text style={styles.subtitle}>Emergency & Ambulance Response</Text>
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
              {isConnected ? 'Command Center Online' : 'Connection Lost'}
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
            <Text style={styles.statNumber}>{activeAmbulances.length}</Text>
            <Text style={styles.statLabel}>Active Ambulances</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{emergencyAlerts.length}</Text>
            <Text style={styles.statLabel}>SOS Alerts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{ambulanceHistory.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Active Ambulances Section */}
      {activeAmbulances.length > 0 && (
        <View style={styles.ambulanceSection}>
          <Text style={styles.sectionTitle}>🚑 Active Ambulance Alerts</Text>
          
          <ScrollView style={styles.ambulanceContainer} showsVerticalScrollIndicator={false}>
            {activeAmbulances.map((ambulance) => (
              <View 
                key={ambulance.id} 
                style={[styles.ambulanceCard, { borderLeftColor: getStatusColor(ambulance.status) }]}
              >
                <View style={styles.ambulanceHeader}>
                  <Text style={styles.ambulanceId}>🚨 ID: {ambulance.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(ambulance.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>{getStatusText(ambulance.status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.ambulanceMessage}>{ambulance.message}</Text>
                
                <View style={styles.locationContainer}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationText}>{ambulance.location?.address}</Text>
                </View>
                
                <View style={styles.timeContainer}>
                  <Text style={styles.timeLabel}>Detected: {formatTime(ambulance.detectedAt)}</Text>
                  {ambulance.clearedAt && (
                    <Text style={styles.timeLabel}>Cleared: {formatTime(ambulance.clearedAt)}</Text>
                  )}
                </View>
                
                <View style={styles.ambulanceActions}>
                  {(ambulance.status === 'active' || ambulance.status === 'detected') && (
                    <TouchableOpacity 
                      style={styles.clearPathButton}
                      onPress={() => clearAmbulancePath(ambulance)}
                    >
                      <Text style={styles.actionButtonText}>🚦 Clear Path</Text>
                    </TouchableOpacity>
                  )}
                  {ambulance.status === 'path_cleared' && (
                    <TouchableOpacity 
                      style={styles.passedButton}
                      onPress={() => markAmbulancePassed(ambulance)}
                    >
                      <Text style={styles.actionButtonText}>✅ Ambulance Passed</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => openLocationMap(ambulance.location)}
                  >
                    <Text style={styles.actionButtonText}>🗺️ View Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Emergency Alerts Section */}
      <View style={styles.alertsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Alerts Feed</Text>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setHistoryModalVisible(true)}
          >
            <Text style={styles.historyButtonText}>📋 History</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.alertsContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {[...emergencyAlerts, ...ambulanceAlerts].length === 0 ? (
            <View style={styles.noAlertsContainer}>
              <Text style={styles.noAlertsIcon}>🛡️</Text>
              <Text style={styles.noAlertsText}>All Systems Clear</Text>
              <Text style={styles.noAlertsSubtext}>Monitoring all emergency channels</Text>
            </View>
          ) : (
            [...emergencyAlerts, ...ambulanceAlerts]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((alert, index) => (
                <TouchableOpacity 
                  key={`alert-${index}`} 
                  style={styles.alertCard}
                  onPress={() => showAlertDetails(alert)}
                >
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertIcon}>
                      {alert.type === 'ambulance_notification' ? '🚑' : '🚨'}
                    </Text>
                    <Text style={styles.alertTime}>
                      {formatTime(alert.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  
                  {alert.location && (
                    <View style={styles.locationContainer}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{alert.location.address}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
          )}
        </ScrollView>
      </View>

      {/* History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ambulance History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.historyList}>
              {ambulanceHistory.length === 0 ? (
                <Text style={styles.noHistoryText}>No completed ambulance clearances yet</Text>
              ) : (
                ambulanceHistory.map((entry, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyId}>ID: {entry.id}</Text>
                      <Text style={styles.historyDate}>{formatDate(entry.detectedAt)}</Text>
                    </View>
                    <Text style={styles.historyLocation}>📍 {entry.location?.address}</Text>
                    <View style={styles.historyTimes}>
                      <Text style={styles.historyTime}>
                        Detected: {formatTime(entry.detectedAt)}
                      </Text>
                      {entry.clearedAt && (
                        <Text style={styles.historyTime}>
                          Cleared: {formatTime(entry.clearedAt)}
                        </Text>
                      )}
                      {entry.passedAt && (
                        <Text style={styles.historyTime}>
                          Passed: {formatTime(entry.passedAt)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✅ Completed</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alert Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedAlert && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Type:</Text>
                <Text style={styles.modalValue}>{selectedAlert.type.replace('_', ' ').toUpperCase()}</Text>
                
                <Text style={styles.modalLabel}>Message:</Text>
                <Text style={styles.modalValue}>{selectedAlert.message}</Text>
                
                <Text style={styles.modalLabel}>Time:</Text>
                <Text style={styles.modalValue}>
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Text>
                
                {selectedAlert.location && (
                  <>
                    <Text style={styles.modalLabel}>Location:</Text>
                    <Text style={styles.modalValue}>{selectedAlert.location.address}</Text>
                    <Text style={styles.modalValue}>
                      Lat: {selectedAlert.location.latitude}, Lng: {selectedAlert.location.longitude}
                    </Text>
                  </>
                )}
                
                {selectedAlert.eta && (
                  <>
                    <Text style={styles.modalLabel}>ETA:</Text>
                    <Text style={styles.modalValue}>{selectedAlert.eta}</Text>
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
    backgroundColor: '#1e3a8a',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    marginTop: 25,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
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
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  ambulanceSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  ambulanceContainer: {
    maxHeight: 300,
  },
  ambulanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 6,
  },
  ambulanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ambulanceId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ambulanceMessage: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ambulanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearPathButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  passedButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertsSection: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  historyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  alertsContainer: {
    flex: 1,
  },
  noAlertsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertTime: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
  },
  locationIcon: {
    marginRight: 6,
    fontSize: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtonText: {
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
  historyList: {
    maxHeight: 400,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  historyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyLocation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  historyTimes: {
    marginBottom: 12,
  },
  historyTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PoliceDashboard;