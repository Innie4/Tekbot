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
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.servicesService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.servicesService.createForTenant(req.tenant.id, dto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.servicesService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto) {
    return this.servicesService.updateForTenant(req.tenant.id, id, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.servicesService.removeForTenant(req.tenant.id, id);
  }
}
