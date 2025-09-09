// mock-server.js - Save this as a separate file and run with Node.js
const WebSocket = require('ws');
const url = require('url');

// Create WebSocket server on port 8000
const wss = new WebSocket.Server({
  port: 8000,
  perMessageDeflate: false,
  verifyClient: (info) => {
    console.log('Client connecting from:', info.origin);
    return true;
  }
});

// Store connections by user type
const connections = {
  police: new Set(),
  hospital: new Set(),
  ambulance: new Set()
};

wss.on('connection', (ws, req) => {
  const pathname = url.parse(req.url).pathname;
  const userType = pathname.split('/')[2]; // Extract user type from /ws/{userType}
  
  console.log(`New ${userType} connection established`);
  
  // Add connection to appropriate set
  if (connections[userType]) {
    connections[userType].add(ws);
  }

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: `Connected as ${userType}`,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received from ${userType}:`, data);
      
      // Handle different message types
      if (data.type === 'ambulance_alert') {
        // Send to police and hospital
        const alertMessage = {
          type: 'alert',
          message: data.message,
          timestamp: data.timestamp,
          from: 'ambulance'
        };
        
        // Send to all police connections
        connections.police.forEach(policeWs => {
          if (policeWs.readyState === WebSocket.OPEN) {
            policeWs.send(JSON.stringify(alertMessage));
          }
        });
        
        // Send to all hospital connections
        connections.hospital.forEach(hospitalWs => {
          if (hospitalWs.readyState === WebSocket.OPEN) {
            hospitalWs.send(JSON.stringify({
              ...alertMessage,
              type: 'patient_incoming'
            }));
          }
        });
        
        console.log('Alert sent to police and hospital');
      }
      
      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`${userType} disconnected`);
    if (connections[userType]) {
      connections[userType].delete(ws);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${userType}:`, error);
  });
});

// Send periodic test messages
setInterval(() => {
  const testAlert = {
    type: 'alert',
    message: `Test emergency alert - ${new Date().toLocaleTimeString()}`,
    timestamp: new Date().toISOString(),
    from: 'system'
  };
  
  // Send test alert to police every 30 seconds
  connections.police.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(testAlert));
    }
  });
  
  // Send test patient alert to hospital
  connections.hospital.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...testAlert,
        type: 'patient_incoming',
        message: `Test patient incoming - ${new Date().toLocaleTimeString()}`
      }));
    }
  });
  
}, 30000); // Every 30 seconds

console.log('Mock WebSocket server running on ws://localhost:8000');
console.log('Endpoints:');
console.log('- ws://localhost:8000/ws/police');
console.log('- ws://localhost:8000/ws/hospital'); 
console.log('- ws://localhost:8000/ws/ambulance');

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});