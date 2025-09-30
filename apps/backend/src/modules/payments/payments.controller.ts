import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.paymentsService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.paymentsService.createForTenant(req.tenant.id, dto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.paymentsService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto) {
    return this.paymentsService.updateForTenant(req.tenant.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.paymentsService.removeForTenant(req.tenant.id, id);
  }
}
