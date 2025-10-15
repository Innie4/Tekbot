import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { OpenAIService } from '../ai/openai.service';
import { CustomersService } from '../customers/customers.service';

interface ChatMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  conversationId?: string;
  sessionId: string;
  tenantId: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

interface JoinRoomData {
  tenantId: string;
  sessionId: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

@WSGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/chat',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly openAIService: OpenAIService,
    private readonly customersService: CustomersService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const roomId = `${data.tenantId}_${data.sessionId}`;
      await client.join(roomId);
      
      this.logger.log(`Client ${client.id} joined room ${roomId}`);
      
      // Store client metadata
      client.data = {
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        customerId: data.customerId,
        roomId,
        metadata: data.metadata,
      };

      client.emit('joined_room', { roomId, success: true });
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() message: ChatMessage,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { tenantId, sessionId, customerId } = client.data;
      const roomId = client.data.roomId;

      // Find or create conversation
      let conversationId = message.conversationId;
      if (!conversationId) {
        // Create new conversation for widget chat
        const conversation = await this.conversationsService.create({
          tenantId,
          customerId,
          channel: 'widget',
          title: `Widget chat - ${sessionId}`,
          metadata: {
            sessionId,
            userAgent: message.metadata?.userAgent,
            referrer: message.metadata?.referrer,
            url: message.metadata?.url,
          },
        });
        conversationId = conversation.id;
      }

      // Save user message
      const userMessageData = {
        conversationId,
        tenantId,
        customerId,
        channel: 'widget',
        direction: 'outbound' as const,
        content: message.content,
        metadata: {
          sessionId,
          socketId: client.id,
          ...message.metadata,
        },
      };

      await this.conversationsService.addMessage(conversationId, tenantId, userMessageData);

      // Broadcast user message to room
      this.server.to(roomId).emit('message_received', {
        ...message,
        conversationId,
        timestamp: new Date(),
      });

      // Generate AI response
      const aiResponse = await this.generateAIResponse(message.content, conversationId, tenantId);

      // Save AI response
      const aiMessageData = {
        conversationId,
        tenantId,
        customerId,
        channel: 'widget',
        direction: 'inbound' as const,
        content: aiResponse,
        metadata: {
          sessionId,
          aiGenerated: true,
          model: 'gpt-3.5-turbo',
        },
      };

      await this.conversationsService.addMessage(conversationId, tenantId, aiMessageData);

      // Send AI response to room
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: aiResponse,
        direction: 'inbound',
        timestamp: new Date(),
        conversationId,
        sessionId,
        tenantId,
        customerId,
        metadata: { aiGenerated: true },
      };

      this.server.to(roomId).emit('message_received', aiMessage);

      // Notify admin dashboard of new conversation activity
      this.server.emit('admin_notification', {
        type: 'new_message',
        tenantId,
        conversationId,
        message: message.content,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(@ConnectedSocket() client: Socket) {
    const roomId = client.data?.roomId;
    if (roomId) {
      client.to(roomId).emit('user_typing', { typing: true });
    }
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(@ConnectedSocket() client: Socket) {
    const roomId = client.data?.roomId;
    if (roomId) {
      client.to(roomId).emit('user_typing', { typing: false });
    }
  }

  @SubscribeMessage('get_conversation_history')
  async handleGetHistory(
    @MessageBody() data: { conversationId: string; limit?: number; offset?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { tenantId } = client.data;
      const messages = await this.conversationsService.getMessages(
        data.conversationId,
        tenantId,
        data.limit || 50,
        data.offset || 0,
      );

      client.emit('conversation_history', { messages });
    } catch (error) {
      this.logger.error(`Error getting conversation history: ${error.message}`);
      client.emit('error', { message: 'Failed to get conversation history' });
    }
  }

  private async generateAIResponse(userMessage: string, conversationId: string, tenantId: string): Promise<string> {
    try {
      // Get recent conversation history for context
      const recentMessages = await this.conversationsService.getMessages(conversationId, tenantId, 10);
      
      // Format messages for OpenAI
      const messages = [
        {
          role: 'system',
          content: 'You are TekAssist, a helpful AI assistant. Provide concise, helpful responses to user questions.',
        },
        ...recentMessages.slice(-5).map(msg => ({
          role: msg.direction === 'outbound' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ];

      return await this.openAIService.getChatResponse(messages);
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  // Method to send messages to specific rooms (for admin notifications)
  sendToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  // Method to broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Method to send message to specific tenant
  sendToTenant(tenantId: string, event: string, data: any) {
    this.connectedClients.forEach((client) => {
      if (client.data?.tenantId === tenantId) {
        client.emit(event, data);
      }
    });
  }
}