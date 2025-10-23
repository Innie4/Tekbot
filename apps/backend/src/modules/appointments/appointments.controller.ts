import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.appointmentsService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.appointmentsService.createForTenant(req.tenant.id, dto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto) {
    return this.appointmentsService.updateForTenant(req.tenant.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.removeForTenant(req.tenant.id, id);
  }
}
