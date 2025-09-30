import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  async findAll(@Request() req) {
    return this.staffService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.staffService.createForTenant(req.tenant.id, dto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.staffService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto) {
    return this.staffService.updateForTenant(req.tenant.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.staffService.removeForTenant(req.tenant.id, id);
  }
}
