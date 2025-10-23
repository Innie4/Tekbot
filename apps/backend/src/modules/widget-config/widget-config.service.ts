import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WidgetConfig } from './entities/widget-config.entity';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';

@Injectable()
export class WidgetConfigService {
  constructor(
    @InjectRepository(WidgetConfig)
    private widgetConfigRepository: Repository<WidgetConfig>,
  ) {}

  async create(
    createWidgetConfigDto: CreateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    const widgetConfig = this.widgetConfigRepository.create(
      createWidgetConfigDto,
    );
    return this.widgetConfigRepository.save(widgetConfig);
  }

  async findByTenant(tenantId: string): Promise<WidgetConfig | null> {
    return this.widgetConfigRepository.findOne({
      where: { tenantId },
    });
  }

  async findOrCreateByTenant(tenantId: string): Promise<WidgetConfig> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new Error('Invalid tenant ID format');
    }

    let config = await this.findByTenant(tenantId);

    if (!config) {
      config = await this.create({
        tenantId,
        title: 'Chat with us',
        welcomeMessage: 'Hello! How can we help you today?',
        placeholder: 'Type your message...',
        position: 'bottom-right',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#EFF6FF',
          textColor: '#1F2937',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          buttonColor: '#3B82F6',
          buttonTextColor: '#FFFFFF',
          headerColor: '#3B82F6',
          headerTextColor: '#FFFFFF',
        },
        branding: {
          showPoweredBy: true,
        },
        behavior: {
          autoOpen: false,
          autoOpenDelay: 3000,
          enableSound: true,
          enableTypingIndicator: true,
          maxHeight: '600px',
          maxWidth: '400px',
        },
        security: {
          allowedDomains: [],
          requireAuth: false,
          enableRateLimit: true,
          rateLimitRequests: 10,
          rateLimitWindow: 60000, // 1 minute
        },
        isActive: true,
        version: 'v1',
      });
    }

    return config;
  }

  async update(
    tenantId: string,
    updateWidgetConfigDto: UpdateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    const config = await this.findOrCreateByTenant(tenantId);

    // Deep merge the configuration objects
    if (updateWidgetConfigDto.theme) {
      config.theme = { ...config.theme, ...updateWidgetConfigDto.theme };
    }

    if (updateWidgetConfigDto.branding) {
      config.branding = {
        ...config.branding,
        ...updateWidgetConfigDto.branding,
      };
    }

    if (updateWidgetConfigDto.behavior) {
      config.behavior = {
        ...config.behavior,
        ...updateWidgetConfigDto.behavior,
      };
    }

    if (updateWidgetConfigDto.security) {
      config.security = {
        ...config.security,
        ...updateWidgetConfigDto.security,
      };
    }

    // Update other fields
    Object.assign(config, {
      ...updateWidgetConfigDto,
      theme: config.theme,
      branding: config.branding,
      behavior: config.behavior,
      security: config.security,
    });

    return this.widgetConfigRepository.save(config);
  }

  async getPublicConfig(tenantId: string): Promise<any> {
    const config = await this.findOrCreateByTenant(tenantId);

    if (!config.isActive) {
      throw new NotFoundException('Widget configuration not found or inactive');
    }

    // Return only public configuration (exclude sensitive data)
    return {
      title: config.title,
      welcomeMessage: config.welcomeMessage,
      placeholder: config.placeholder,
      position: config.position,
      theme: config.theme,
      branding: {
        logo: config.branding.logo,
        companyName: config.branding.companyName,
        showPoweredBy: config.branding.showPoweredBy,
      },
      behavior: {
        autoOpen: config.behavior.autoOpen,
        autoOpenDelay: config.behavior.autoOpenDelay,
        enableSound: config.behavior.enableSound,
        enableTypingIndicator: config.behavior.enableTypingIndicator,
        maxHeight: config.behavior.maxHeight,
        maxWidth: config.behavior.maxWidth,
      },
      version: config.version,
    };
  }

  async generateEmbedCode(tenantId: string, domain?: string): Promise<string> {
    const config = await this.findOrCreateByTenant(tenantId);

    if (!config.isActive) {
      throw new NotFoundException('Widget configuration not found or inactive');
    }

    // Check domain restrictions
    if (
      config.security.allowedDomains &&
      config.security.allowedDomains.length > 0
    ) {
      if (!domain || !config.security.allowedDomains.includes(domain)) {
        throw new Error('Domain not allowed');
      }
    }

    const baseUrl =
      process.env.WIDGET_CDN_URL ||
      process.env.BASE_URL ||
      'http://localhost:3000';

    return `
<!-- TekAssist Chat Widget -->
<script>
  (function() {
    window.TekAssistConfig = {
      tenantId: '${tenantId}',
      apiUrl: '${baseUrl}/api',
      widgetUrl: '${baseUrl}/widget'
    };
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/embed.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End TekAssist Chat Widget -->`.trim();
  }

  async remove(tenantId: string): Promise<void> {
    const config = await this.findByTenant(tenantId);
    if (config) {
      await this.widgetConfigRepository.remove(config);
    }
  }

  async toggleActive(tenantId: string): Promise<WidgetConfig> {
    const config = await this.findOrCreateByTenant(tenantId);
    config.isActive = !config.isActive;
    return this.widgetConfigRepository.save(config);
  }
}
