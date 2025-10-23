import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
    type: [Tenant],
  })
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Get('current')
  @Roles('tenant_admin', 'admin')
  @ApiOperation({ summary: 'Get current tenant' })
  @ApiResponse({
    status: 200,
    description: 'Current tenant retrieved successfully',
    type: Tenant,
  })
  async getCurrentTenant(@Request() req): Promise<Tenant> {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 409,
    description: 'Tenant with this subdomain or domain already exists',
  })
  async create(@Body() createTenantData: Partial<Tenant>): Promise<Tenant> {
    return this.tenantsService.create(createTenantData);
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.findOne(id);
  }

  @Patch('current')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Update current tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: Tenant,
  })
  async updateCurrent(
    @Request() req,
    @Body() updateData: Partial<Tenant>,
  ): Promise<Tenant> {
    // Remove sensitive fields that tenant admins shouldn't be able to update
    const {
      status,
      plan,
      stripeCustomerId,
      stripeSubscriptionId,
      ...allowedUpdates
    } = updateData;
    return this.tenantsService.update(req.user.tenantId, allowedUpdates);
  }

  @Patch(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: Tenant,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Tenant>,
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateData);
  }

  @Patch(':id/activate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant activated successfully',
    type: Tenant,
  })
  async activate(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.activate(id);
  }

  @Patch(':id/suspend')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Suspend tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspended successfully',
    type: Tenant,
  })
  async suspend(@Param('id') id: string): Promise<Tenant> {
    return this.tenantsService.suspend(id);
  }

  @Patch('current/settings')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Update current tenant settings' })
  @ApiResponse({
    status: 200,
    description: 'Tenant settings updated successfully',
    type: Tenant,
  })
  async updateSettings(
    @Request() req,
    @Body() settings: Record<string, any>,
  ): Promise<Tenant> {
    return this.tenantsService.updateSettings(req.user.tenantId, settings);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.tenantsService.remove(id);
    return { message: 'Tenant deleted successfully' };
  }
}
