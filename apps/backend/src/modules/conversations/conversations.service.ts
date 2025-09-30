import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      last_activity_at: new Date(),
    });
    return this.conversationRepository.save(conversation);
  }

  async findAll(tenantId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { tenantId },
      relations: ['customer'],
      order: { last_activity_at: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, tenantId },
      relations: ['customer', 'messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async findBySessionId(sessionId: string, tenantId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { sessionId, tenantId },
      relations: ['messages'],
    });
  }

  async findOrCreateBySessionId(
    sessionId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<Conversation> {
    let conversation = await this.findBySessionId(sessionId, tenantId);
    
    if (!conversation) {
      conversation = await this.create({
        tenantId,
        sessionId,
        channel: 'web',
        status: 'active',
        metadata,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        referrer: metadata?.referrer,
      });
    }

    return conversation;
  }

  async update(id: string, tenantId: string, updateConversationDto: UpdateConversationDto): Promise<Conversation> {
    const conversation = await this.findOne(id, tenantId);
    
    Object.assign(conversation, updateConversationDto);
    conversation.updated_at = new Date();
    
    return this.conversationRepository.save(conversation);
  }

  async updateLastActivity(id: string, tenantId: string): Promise<void> {
    await this.conversationRepository.update(
      { id, tenantId },
      { last_activity_at: new Date() }
    );
  }

  async addMessage(conversationId: string, tenantId: string, messageData: any): Promise<Message> {
    const conversation = await this.findOne(conversationId, tenantId);
    
    const message = this.messageRepository.create({
      ...messageData,
      conversationId,
      tenantId,
    });

    const savedMessage = await this.messageRepository.save(message);
    
    // Update conversation's last activity
    await this.updateLastActivity(conversationId, tenantId);
    
    return savedMessage as unknown as Message;
  }

  async getMessages(conversationId: string, tenantId: string, limit = 50, offset = 0): Promise<Message[]> {
    await this.findOne(conversationId, tenantId); // Verify conversation exists
    
    const messages = await this.messageRepository.find({
      where: { conversationId, tenantId },
      order: { created_at: 'ASC' },
      take: limit,
      skip: offset,
    });
    
    return messages;
  }

  async closeConversation(id: string, tenantId: string): Promise<Conversation> {
    return this.update(id, tenantId, { status: 'closed' });
  }

  async archiveConversation(id: string, tenantId: string): Promise<Conversation> {
    return this.update(id, tenantId, { status: 'archived' });
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const conversation = await this.findOne(id, tenantId);
    await this.conversationRepository.remove(conversation);
  }

  async getActiveConversationsCount(tenantId: string): Promise<number> {
    return this.conversationRepository.count({
      where: { tenantId, status: 'active' },
    });
  }

  async getConversationsByCustomer(customerId: string, tenantId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { customerId, tenantId },
      relations: ['messages'],
      order: { last_activity_at: 'DESC' },
    });
  }
}