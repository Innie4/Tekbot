import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { StripeService } from './stripe.service';
import { PaystackService } from './paystack.service';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(@Request() req) {
    return this.paymentsService.findAllForTenant(req.tenant.id);
  }

  @Post()
  async create(@Request() req, @Body() dto) {
    return this.paymentsService.createForTenant(req.tenant.id, dto);
  }

  // Public endpoint to generate payment links for widget/chat
  @Post('link')
  @Public()
  async createPaymentLink(
    @Body()
    dto: {
      provider: 'stripe' | 'paystack';
      amount: number;
      currency?: string;
      successUrl?: string;
      cancelUrl?: string;
      email?: string;
      description?: string;
      metadata?: Record<string, string>;
    },
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const currency = (dto.currency || (dto.provider === 'paystack' ? 'NGN' : 'USD')).toUpperCase();

    if (dto.provider === 'stripe') {
      const session = await this.stripeService.createCheckoutSession({
        amount: dto.amount,
        currency,
        successUrl: dto.successUrl || `${frontendUrl}/payment/success`,
        cancelUrl: dto.cancelUrl || `${frontendUrl}/payment/cancel`,
        customerEmail: dto.email,
        description: dto.description,
        metadata: { ...(dto.metadata || {}), tenantId: tenantId || 'default' },
      });
      return { provider: 'stripe', url: session.url, sessionId: session.id };
    }

    // Default to Paystack
    const res = await this.paystackService.initializeTransaction(dto.amount, dto.email || 'customer@example.com');
    const data = res.data?.data || {};
    return { provider: 'paystack', url: data.authorization_url, reference: data.reference };
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
