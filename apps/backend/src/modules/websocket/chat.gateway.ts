import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OpenAIService } from '../ai/openai.service';

interface ChatMessage {
  message: string;
  tenantId?: string;
  sessionId?: string;
  conversationId?: string;
  userId?: string;
}

interface ConnectedClient {
  id: string;
  tenantId?: string;
  sessionId?: string;
  userId?: string;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();

  constructor(private readonly openAIService: OpenAIService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const { tenantId, sessionId, userId } = client.handshake.query;
    
    const clientInfo: ConnectedClient = {
      id: client.id,
      tenantId: tenantId as string,
      sessionId: sessionId as string,
      userId: userId as string,
      connectedAt: new Date(),
    };

    this.connectedClients.set(client.id, clientInfo);
    
    this.logger.log(`Client connected: ${client.id} (tenant: ${tenantId}, session: ${sessionId})`);
    
    // Join tenant-specific room
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
    }
    
    // Join session-specific room
    if (sessionId) {
      client.join(`session:${sessionId}`);
    }

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to TekBot chat',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);
    
    this.logger.log(`Client disconnected: ${client.id}`);
    
    if (clientInfo) {
      // Leave rooms
      if (clientInfo.tenantId) {
        client.leave(`tenant:${clientInfo.tenantId}`);
      }
      if (clientInfo.sessionId) {
        client.leave(`session:${clientInfo.sessionId}`);
      }
    }
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      
      this.logger.log(`Received message from ${client.id}: ${data.message}`);

      // Send typing indicator
      client.emit('typing', { isTyping: true });

      // Get AI response
      const messages = [{ role: 'user', content: data.message }];
      let aiResponse: string;

      try {
        aiResponse = await this.openAIService.getChatResponse(messages);
      } catch (error) {
        this.logger.error('OpenAI service error:', error.message);
        aiResponse = 'Sorry, I encountered an error processing your message. Please try again.';
      }

      // Stop typing indicator
      client.emit('typing', { isTyping: false });

      // Send response back to client
      const response = {
        id: `msg_${Date.now()}`,
        message: aiResponse,
        type: 'bot',
        timestamp: new Date().toISOString(),
        conversationId: data.conversationId || `conv_${clientInfo?.sessionId}`,
        sessionId: data.sessionId || clientInfo?.sessionId,
        tenantId: data.tenantId || clientInfo?.tenantId,
      };

      client.emit('chat_response', response);

      // Optionally broadcast to tenant room (for admin monitoring)
      if (clientInfo?.tenantId) {
        client.to(`tenant:${clientInfo.tenantId}`).emit('chat_activity', {
          type: 'message_received',
          clientId: client.id,
          sessionId: clientInfo.sessionId,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      this.logger.error('Error handling chat message:', error);
      
      client.emit('chat_error', {
        error: 'Failed to process message',
        message: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (clientInfo?.sessionId) {
      // Broadcast typing status to session room (excluding sender)
      client.to(`session:${clientInfo.sessionId}`).emit('user_typing', {
        clientId: client.id,
        isTyping: data.isTyping,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    
    client.emit('joined_conversation', {
      conversationId: data.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    
    client.emit('left_conversation', {
      conversationId: data.conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  // Admin methods
  @SubscribeMessage('get_active_sessions')
  handleGetActiveSessions(@ConnectedSocket() client: Socket) {
    const sessions = Array.from(this.connectedClients.values()).map(client => ({
      id: client.id,
      tenantId: client.tenantId,
      sessionId: client.sessionId,
      userId: client.userId,
      connectedAt: client.connectedAt,
    }));

    client.emit('active_sessions', sessions);
  }

  // Utility methods
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getClientsByTenant(tenantId: string): ConnectedClient[] {
    return Array.from(this.connectedClients.values()).filter(
      client => client.tenantId === tenantId
    );
  }

  broadcastToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  broadcastToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }
}