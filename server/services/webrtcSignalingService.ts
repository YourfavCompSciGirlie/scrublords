import { WebSocket, WebSocketServer } from 'ws';
import { videoCallService } from './videoCallService';
import jwt from 'jsonwebtoken';

interface SignalingMessage {
  type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'leave';
  callId: string;
  userId: string;
  data?: any;
}

interface CallRoom {
  callId: string;
  participants: Map<string, WebSocket>;
}

export class WebRTCSignalingService {
  private wss: WebSocketServer;
  private rooms: Map<string, CallRoom> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/video-signaling'
    });

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      // Extract and verify JWT token from query string
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log('WebSocket connection rejected: No token provided');
        ws.close(1008, 'Authentication required');
        return;
      }

      const authResult = WebRTCSignalingService.authenticateWebSocket(token);
      if (!authResult) {
        console.log('WebSocket connection rejected: Invalid token');
        ws.close(1008, 'Authentication failed');
        return;
      }

      // Store authenticated userId on WebSocket
      (ws as any).authenticatedUserId = authResult.userId;
      console.log(`New WebRTC signaling connection for user: ${authResult.userId}`);
      
      ws.on('message', async (message: string) => {
        try {
          const data: SignalingMessage = JSON.parse(message);
          // Use authenticated userId instead of client-provided one
          await this.handleMessage(ws, { ...data, userId: authResult.userId });
        } catch (error) {
          console.error('Error handling signaling message:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: SignalingMessage) {
    const { type, callId, userId, data } = message;

    // Verify user has access to this call
    const videoCall = await videoCallService.getVideoCall(callId);
    if (!videoCall) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Video call not found' 
      }));
      return;
    }

    if (videoCall.initiatorId !== userId && videoCall.participantId !== userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Access denied to this call' 
      }));
      return;
    }

    switch (type) {
      case 'join':
        await this.handleJoin(ws, callId, userId);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relaySignalingMessage(callId, userId, { type, data });
        break;
      case 'leave':
        this.handleLeave(callId, userId);
        break;
    }
  }

  private async handleJoin(ws: WebSocket, callId: string, userId: string) {
    // Get or create room
    let room = this.rooms.get(callId);
    if (!room) {
      room = {
        callId,
        participants: new Map()
      };
      this.rooms.set(callId, room);
    }

    // Check if user is already in the room (prevent duplicate connections)
    if (room.participants.has(userId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User already connected to this call'
      }));
      return;
    }

    // Enforce maximum of 2 participants per call
    if (room.participants.size >= 2) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Call is full'
      }));
      return;
    }

    // Add participant to room
    room.participants.set(userId, ws);
    
    // Store callId on WebSocket for cleanup (userId already stored as authenticatedUserId)
    (ws as any).callId = callId;

    // Notify other participants about new joiner
    this.broadcastToRoom(callId, {
      type: 'user-joined',
      userId
    }, userId);

    // Send confirmation to joiner
    ws.send(JSON.stringify({
      type: 'joined',
      callId,
      participantCount: room.participants.size
    }));

    console.log(`User ${userId} joined call ${callId} (${room.participants.size}/2 participants)`);
  }

  private relaySignalingMessage(callId: string, fromUserId: string, message: any) {
    const room = this.rooms.get(callId);
    if (!room) return;

    // Relay to other participants
    this.broadcastToRoom(callId, {
      ...message,
      fromUserId
    }, fromUserId);
  }

  private handleLeave(callId: string, userId: string) {
    const room = this.rooms.get(callId);
    if (!room) return;

    room.participants.delete(userId);

    // Notify other participants
    this.broadcastToRoom(callId, {
      type: 'user-left',
      userId
    });

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(callId);
    }

    console.log(`User ${userId} left call ${callId}`);
  }

  private handleDisconnect(ws: WebSocket) {
    const callId = (ws as any).callId;
    const userId = (ws as any).authenticatedUserId;

    if (callId && userId) {
      this.handleLeave(callId, userId);
    }
  }

  private broadcastToRoom(callId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(callId);
    if (!room) return;

    room.participants.forEach((ws, userId) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Verify JWT token for WebSocket authentication
  static authenticateWebSocket(token: string): { userId: string } | null {
    try {
      const sessionSecret = process.env.SESSION_SECRET;
      if (!sessionSecret) {
        console.error('SESSION_SECRET not configured');
        return null;
      }

      const decoded = jwt.verify(token, sessionSecret) as any;
      if (!decoded || !decoded.userId) {
        return null;
      }

      return { userId: decoded.userId };
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }
}

export let webrtcSignalingService: WebRTCSignalingService;