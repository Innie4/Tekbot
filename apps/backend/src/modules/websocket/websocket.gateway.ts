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
import { LeadsService } from '../leads/leads.service';

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
    private readonly leadsService: LeadsService,
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

  // Alias to support widget clients emitting 'joinRoom'
  @SubscribeMessage('joinRoom')
  async handleJoinRoomAlias(
    @MessageBody() data: JoinRoomData,
    @ConnectedSocket() client: Socket,
  ) {
    return this.handleJoinRoom(data, client);
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

      // Attempt lead capture based on message content/metadata
      await this.captureLeadIfApplicable(message, tenantId, customerId, conversationId, roomId);

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

      // Send AI response to room (both legacy and widget alias events)
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
      this.server.to(roomId).emit('message', {
        message: aiResponse,
        timestamp: new Date(),
        sessionId,
        messageId: aiMessage.id,
      });

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

  // Alias to support widget clients emitting 'message'
  @SubscribeMessage('message')
  async handleWidgetMessage(
    @MessageBody() message: ChatMessage,
    @ConnectedSocket() client: Socket,
  ) {
    return this.handleMessage(message, client);
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

  private extractEmail(text: string): string | undefined {
    const match = text?.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    return match ? match[0] : undefined;
  }

  private extractPhone(text: string): string | undefined {
    const match = text?.match(/\+?\d[\d\s\-().]{7,}\d/);
    return match ? match[0] : undefined;
  }

  private async captureLeadIfApplicable(
    message: ChatMessage,
    tenantId: string,
    customerId: string | undefined,
    conversationId: string,
    roomId: string,
  ): Promise<void> {
    try {
      const conversation = await this.conversationsService.findOne(conversationId, tenantId);
      const alreadyCaptured = conversation.metadata?.leadCaptured;
      if (alreadyCaptured) return;

      const meta = message.metadata || {};
      const content = message.content || '';

      const email = meta.email || meta.contact?.email || this.extractEmail(content);
      const phone = meta.phone || meta.contact?.phone || this.extractPhone(content);
      const serviceInterest = meta.service_interest || meta.intent || meta.service || meta.product;

      // Only capture if we have a signal (contact or interest)
      if (!email && !phone && !serviceInterest) {
        return;
      }

      let resolvedCustomerId = customerId;

      if (!resolvedCustomerId) {
        // Try to find existing customer by phone
        if (phone) {
          const existing = await this.customersService.findByPhone(phone);
          if (existing && existing.tenantId === tenantId) {
            resolvedCustomerId = existing.id;
          }
        }

        if (!resolvedCustomerId) {
          const name = meta.name || meta.contact?.name || 'Website Visitor';
          const created = await this.customersService.createForTenant(tenantId, {
            name,
            email,
            phone,
            preferences: { source: 'widget', ...meta },
          });
          resolvedCustomerId = created.id;
        }
      }

      const notes = meta.notes || `Widget chat: ${content.slice(0, 500)}`;
      const lead = await this.leadsService.createForTenant(tenantId, {
        customerId: resolvedCustomerId,
        source: 'widget',
        status: 'new',
        service_interest: serviceInterest,
        notes,
      });

      const updatedMetadata = { ...(conversation.metadata || {}), leadCaptured: true, leadId: lead.id };
      await this.conversationsService.update(conversationId, tenantId, { metadata: updatedMetadata });

      // Notify admin systems
      this.server.emit('admin_notification', {
        type: 'new_lead',
        tenantId,
        conversationId,
        leadId: lead.id,
        timestamp: new Date(),
      });

      // Optionally notify participants in the room
      this.server.to(roomId).emit('lead_captured', { leadId: lead.id });
    } catch (error) {
      this.logger.error(`Error capturing lead: ${error.message}`, error.stack);
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