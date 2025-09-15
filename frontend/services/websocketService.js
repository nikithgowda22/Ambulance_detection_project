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

//   // ✅ Always connect to your computer's IP when using physical device
//   getWebSocketUrl(userType) {
//     let host;

//     if (Platform.OS === 'ios' || Platform.OS === 'android') {
//       // For physical devices (iPhone, Android phone)
//       host = '192.168.1.4';  // 172.20.10.4<-- your computer’s IP
//     } else {
//       // For simulators/emulators
//       host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
//     }

//     return `ws://${host}:8000/ws/${userType}`;
//   }

//   connect(userType) {
//     if (this.reconnectTimer) {
//       clearTimeout(this.reconnectTimer);
//       this.reconnectTimer = null;
//     }

//     if (this.socket && this.isConnected && this.currentUserType === userType) {
//       console.log(`WebSocket already connected to ${userType}`);
//       return;
//     }

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
//         console.log(`✅ WebSocket connected to ${userType}`);
//         this.isConnected = true;
//         this.reconnectAttempts = 0;
//       };

//       this.socket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           console.log('📩 Received message:', data);
//           this.messageHandlers.forEach(handler => handler(data));
//         } catch (error) {
//           console.error('❌ Error parsing WebSocket message:', error);
//         }
//       };

//       this.socket.onclose = (event) => {
//         console.log('⚠️ WebSocket disconnected:', event.code, event.reason);
//         this.isConnected = false;

//         if (event.code !== 1000) {
//           this.attemptReconnect(userType);
//         }
//       };

//       this.socket.onerror = (error) => {
//         console.error('❌ WebSocket error:', error);
//         this.isConnected = false;
//       };

//     } catch (error) {
//       console.error('❌ Error creating WebSocket:', error);
//       this.attemptReconnect(userType);
//     }
//   }

//   attemptReconnect(userType) {
//     if (this.reconnectAttempts < this.maxReconnectAttempts) {
//       this.reconnectAttempts++;
//       const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
//       console.log(`🔄 Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

//       this.reconnectTimer = setTimeout(() => {
//         this.connect(userType);
//       }, delay);
//     } else {
//       console.log('❌ Max reconnection attempts reached.');
//     }
//   }

//   addMessageHandler(handler) {
//     if (typeof handler === 'function') {
//       this.messageHandlers.push(handler);
//     }
//   }

//   removeMessageHandler(handler) {
//     this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
//   }

//   disconnect() {
//     if (this.reconnectTimer) {
//       clearTimeout(this.reconnectTimer);
//       this.reconnectTimer = null;
//     }

//     if (this.socket) {
//       console.log('👋 Manually disconnecting WebSocket');
//       this.socket.close(1000, 'Manual disconnect');
//       this.socket = null;
//       this.isConnected = false;
//       this.currentUserType = null;
//     }
//   }
// }

// export default new WebSocketService();


// services/websocketService.js
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
      host = '192.168.1.8';  // your computer's IP
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

  // ✅ Enhanced sendMessage method
  sendMessage(message) {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify(message));
        console.log('📤 Sent message:', message);
      } catch (error) {
        console.error('❌ Error sending message:', error);
      }
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
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

  // ✅ Get current location (mock implementation)
  getCurrentLocation() {
    // In real app, use react-native-geolocation-service or @react-native-community/geolocation
    return new Promise((resolve) => {
      // Mock coordinates for different areas
      const mockLocations = [
        { latitude: 12.9716, longitude: 77.5946, address: "MG Road, Bangalore" },
        { latitude: 12.9698, longitude: 77.7500, address: "Whitefield, Bangalore" },
        { latitude: 12.9352, longitude: 77.6245, address: "Koramangala, Bangalore" },
        { latitude: 12.9279, longitude: 77.6271, address: "BTM Layout, Bangalore" },
        { latitude: 12.9141, longitude: 77.6081, address: "JP Nagar, Bangalore" },
      ];
      
      const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
      resolve(randomLocation);
    });
  }
}

export default new WebSocketService();

// // uvicorn app:app --host 0.0.0.0 --port 8000 --reload
