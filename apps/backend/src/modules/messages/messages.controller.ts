import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.messagesService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.messagesService.createForTenant(req.tenant.id, dto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.messagesService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto) {
    return this.messagesService.updateForTenant(req.tenant.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.messagesService.removeForTenant(req.tenant.id, id);
  }
}
