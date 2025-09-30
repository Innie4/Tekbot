import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import speakeasy from 'speakeasy';

@Injectable()
export class MfaService {
  constructor(private readonly configService: ConfigService) {}

  generateSecret() {
    return speakeasy.generateSecret({ length: 20 });
  }

  verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }
}
