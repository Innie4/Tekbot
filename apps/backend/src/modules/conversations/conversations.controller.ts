import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Headers,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // Public endpoint for widget to create conversations
  @Post('widget')
  @Public()
  async createWidgetConversation(
    @Body() body: { sessionId?: string; metadata?: any },
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    try {
      const conversationData = {
        sessionId: body.sessionId || `session_${Date.now()}`,
        tenantId: tenantId || 'default',
        metadata: body.metadata || {},
        status: 'active' as const,
        channel: 'widget',
      };

      return await this.conversationsService.create(conversationData);
    } catch (error) {
      console.error('Widget conversation creation error:', error);
      return {
        error: true,
        message: 'Failed to create conversation',
        conversationId: null,
      };
    }
  }

  // Public endpoint for widget to get or create conversation by session
  @Get('widget/:sessionId')
  @Public()
  async getWidgetConversation(
    @Param('sessionId') sessionId: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    try {
      return await this.conversationsService.findBySessionId(
        sessionId,
        tenantId || 'default',
      );
    } catch (error) {
      console.error('Widget conversation retrieval error:', error);
      return null;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard)
  create(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req: any,
  ) {
    return this.conversationsService.create({
      ...createConversationDto,
      tenantId: req.tenant.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  findAll(@Req() req: any) {
    return this.conversationsService.findAll(req.tenant.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getStats(@Req() req: any) {
    const activeCount =
      await this.conversationsService.getActiveConversationsCount(
        req.tenant.id,
      );
    return { activeConversations: activeCount };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.findOne(id, req.tenant.id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard, TenantGuard)
  getMessages(
    @Param('id') id: string,
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.conversationsService.getMessages(
      id,
      req.tenant.id,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard, TenantGuard)
  addMessage(
    @Param('id') id: string,
    @Body() messageData: any,
    @Req() req: any,
  ) {
    return this.conversationsService.addMessage(id, req.tenant.id, messageData);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @Req() req: any,
  ) {
    return this.conversationsService.update(
      id,
      req.tenant.id,
      updateConversationDto,
    );
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.closeConversation(id, req.tenant.id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.archiveConversation(id, req.tenant.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.remove(id, req.tenant.id);
  }

  @Get('customer/:customerId')
  getByCustomer(@Param('customerId') customerId: string, @Req() req: any) {
    return this.conversationsService.getConversationsByCustomer(
      customerId,
      req.tenant.id,
    );
  }
}
