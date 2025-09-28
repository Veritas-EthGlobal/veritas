const WebSocket = require('ws');

// We'll use port 8080 for the WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// This object will store the detailed status of all ongoing matches.
const matches = {};

console.log("WebSocket server started on port 8080");

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      // 'payload' will now carry the result data from the player's API call
      const { type, matchId, role, payload } = data;

      if (type === 'join') {
        ws.matchId = matchId;
        // Initialize match with a more detailed structure
        if (!matches[matchId]) {
          matches[matchId] = {
            user1: { ready: false, result: null },
            user2: { ready: false, result: null }
          };
        }
        console.log(`Client joined match: ${matchId}`);
        broadcastStatus(matchId);
      }

      // NEW: Handle when a player sends their analysis result
      if (type === 'submissionResult') {
        if (matches[matchId] && role) {
          console.log(`Received result from ${role} for match ${matchId}`);
          matches[matchId][role].ready = true;
          matches[matchId][role].result = payload; // Store the result data
          broadcastStatus(matchId);
        }
      }

    } catch (error) {
      console.error('Failed to parse message or invalid message format:', message, error);
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

// Broadcasts the entire status object, including results, to the match room
function broadcastStatus(matchId) {
  const status = matches[matchId];
  if (!status) return;

  wss.clients.forEach(client => {
    if (client.matchId === matchId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'statusUpdate',
        user1: status.user1, // Send the whole user1 object (ready status + result)
        user2: status.user2  // Send the whole user2 object
      }));
    }
  });
}

