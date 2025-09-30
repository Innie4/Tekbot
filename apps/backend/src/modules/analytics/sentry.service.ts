import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryService {
  constructor(private readonly configService: ConfigService) {
    Sentry.init({
      dsn: configService.get<string>('SENTRY_DSN'),
      tracesSampleRate: 1.0,
    });
  }

  captureException(error: any) {
    Sentry.captureException(error);
  }
}
