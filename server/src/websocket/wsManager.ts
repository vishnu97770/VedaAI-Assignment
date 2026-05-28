import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const clients = new Map<string, WebSocket>();

export const initWebSocket = (server: Server): void => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let clientId: string = '';

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'register' && data.assignmentId) {
          clientId = data.assignmentId;
          clients.set(clientId, ws);
          console.log(`Client registered for assignment: ${clientId}`);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (clientId) {
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      }
    });
  });

  console.log('WebSocket server initialized');
};

export const notifyClient = (assignmentId: string, data: object): void => {
  const client = clients.get(assignmentId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
};