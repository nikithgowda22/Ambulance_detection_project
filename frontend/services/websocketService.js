// // frontend/services/websocketService.js
// import { Platform } from 'react-native';

// class WebSocketService {
//   constructor() {
//     this.socket = null;
//     this.messageHandlers = [];
//     this.reconnectAttempts = 0;
//     this.maxReconnectAttempts = 5;
//     this.isConnected = false;
//     this.reconnectTimer = null;
//     this.currentUserType = null;
//   }

//   getWebSocketUrl(userType) {
//     // For development - adjust these based on your environment
//     let host;
//     let port = 8000; // Default WebSocket port
    
//     if (__DEV__) {
//       if (Platform.OS === 'android') {
//         // Android emulator can use 10.0.2.2 to access host machine
//         host = '10.0.2.2';
//       } else if (Platform.OS === 'ios') {
//         // iOS simulator uses localhost
//         host = 'localhost';
//       } else {
//         // Physical devices need the actual IP of your computer
//         // You need to replace this with your computer's actual IP address
//         host = '192.168.1.9'; // Replace with your computer's IP
        
//         // Alternative ports to try if 8000 doesn't work
//         // port = 3000; // if using Node.js/Express
//         // port = 8080; // alternative port
//       }
//     } else {
//       // Production - use your deployed backend URL
//       host = 'your-production-backend.com';
//       port = 443; // Use 443 for wss:// in production
//     }
    
//     const protocol = __DEV__ ? 'ws' : 'wss';
//     return `${protocol}://${host}:${port}/ws/${userType}`;
//   }

//   connect(userType) {
//     // Clear any existing reconnect timer
//     if (this.reconnectTimer) {
//       clearTimeout(this.reconnectTimer);
//       this.reconnectTimer = null;
//     }

//     // Don't connect if already connected to the same user type
//     if (this.socket && this.isConnected && this.currentUserType === userType) {
//       console.log(`WebSocket already connected to ${userType}`);
//       return;
//     }

//     // Disconnect existing connection if connecting to different user type
//     if (this.socket && this.currentUserType !== userType) {
//       console.log(`Switching connection from ${this.currentUserType} to ${userType}`);
//       this.disconnect();
//     }

//     this.currentUserType = userType;
//     const wsUrl = this.getWebSocketUrl(userType);
//     console.log('Connecting to WebSocket:', wsUrl);
    
//     try {
//       this.socket = new WebSocket(wsUrl);
      
//       this.socket.onopen = () => {
//         console.log(`WebSocket connected to ${userType}`);
//         this.isConnected = true;
//         this.reconnectAttempts = 0;
        
//         // Send initial connection message
//         this.sendMessage({
//           type: 'connection',
//           userType: userType,
//           timestamp: new Date().toISOString()
//         });
//       };
      
//       this.socket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           console.log('Received message:', data);
//           this.messageHandlers.forEach(handler => {
//             try {
//               handler(data);
//             } catch (handlerError) {
//               console.error('Error in message handler:', handlerError);
//             }
//           });
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };
      
//       this.socket.onclose = (event) => {
//         console.log('WebSocket disconnected:', event.code, event.reason);
//         this.isConnected = false;
        
//         // Only attempt reconnect if it wasn't a manual disconnect
//         if (event.code !== 1000) {
//           this.attemptReconnect(userType);
//         }
//       };
      
//       this.socket.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         this.isConnected = false;
//       };
      
//     } catch (error) {
//       console.error('Error creating WebSocket:', error);
//       this.attemptReconnect(userType);
//     }
//   }
  
//   attemptReconnect(userType) {
//     if (this.reconnectAttempts < this.maxReconnectAttempts) {
//       this.reconnectAttempts++;
//       const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
      
//       console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
//       this.reconnectTimer = setTimeout(() => {
//         this.connect(userType);
//       }, delay);
//     } else {
//       console.log('Max reconnection attempts reached');
//       // Reset attempts after a longer delay to allow manual reconnection
//       setTimeout(() => {
//         this.reconnectAttempts = 0;
//         console.log('Reconnection attempts reset. Manual reconnection available.');
//       }, 60000); // Reset after 1 minute
//     }
//   }
  
//   addMessageHandler(handler) {
//     if (typeof handler === 'function') {
//       this.messageHandlers.push(handler);
//     } else {
//       console.error('Message handler must be a function');
//     }
//   }
  
//   removeMessageHandler(handler) {
//     this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
//   }
  
//   disconnect() {
//     // Clear reconnect timer
//     if (this.reconnectTimer) {
//       clearTimeout(this.reconnectTimer);
//       this.reconnectTimer = null;
//     }

//     if (this.socket) {
//       console.log('Manually disconnecting WebSocket');
//       this.socket.close(1000, 'Manual disconnect'); // Normal closure
//       this.socket = null;
//       this.isConnected = false;
//       this.currentUserType = null;
//     }
//   }
  
//   sendMessage(message) {
//     if (this.socket && this.isConnected) {
//       try {
//         const messageString = JSON.stringify(message);
//         this.socket.send(messageString);
//         console.log('Sent message:', message);
//       } catch (error) {
//         console.error('Error sending message:', error);
//       }
//     } else {
//       console.error('WebSocket is not connected. Cannot send message:', message);
//     }
//   }

//   // Method to test connection with different configurations
//   testConnection(userType, customHost = null, customPort = null) {
//     const originalGetUrl = this.getWebSocketUrl;
    
//     if (customHost || customPort) {
//       this.getWebSocketUrl = (userType) => {
//         const host = customHost || 'localhost';
//         const port = customPort || 8000;
//         return `ws://${host}:${port}/ws/${userType}`;
//       };
//     }

//     console.log('Testing connection with custom settings...');
//     this.connect(userType);

//     // Restore original method
//     setTimeout(() => {
//       this.getWebSocketUrl = originalGetUrl;
//     }, 5000);
//   }

//   // Get connection status
//   getStatus() {
//     return {
//       isConnected: this.isConnected,
//       userType: this.currentUserType,
//       reconnectAttempts: this.reconnectAttempts,
//       maxReconnectAttempts: this.maxReconnectAttempts
//     };
//   }
// }

// export default new WebSocketService();



import { Platform } from 'react-native';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.currentUserType = null;
  }

  // ✅ Always connect to your computer's IP when using physical device
  getWebSocketUrl(userType) {
    let host;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // For physical devices (iPhone, Android phone)
      host = '192.168.1.9';  // <-- your computer’s IP
    } else {
      // For simulators/emulators
      host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    }

    return `ws://${host}:8000/ws/${userType}`;
  }

  connect(userType) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket && this.isConnected && this.currentUserType === userType) {
      console.log(`WebSocket already connected to ${userType}`);
      return;
    }

    if (this.socket && this.currentUserType !== userType) {
      console.log(`Switching connection from ${this.currentUserType} to ${userType}`);
      this.disconnect();
    }

    this.currentUserType = userType;
    const wsUrl = this.getWebSocketUrl(userType);
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log(`✅ WebSocket connected to ${userType}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Received message:', data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('⚠️ WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;

        if (event.code !== 1000) {
          this.attemptReconnect(userType);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      this.attemptReconnect(userType);
    }
  }

  attemptReconnect(userType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`🔄 Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        this.connect(userType);
      }, delay);
    } else {
      console.log('❌ Max reconnection attempts reached.');
    }
  }

  addMessageHandler(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }

  removeMessageHandler(handler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      console.log('👋 Manually disconnecting WebSocket');
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
      this.isConnected = false;
      this.currentUserType = null;
    }
  }
}

export default new WebSocketService();
