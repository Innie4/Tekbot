import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-super-secret-refresh-key-change-this-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'tekbot-platform',
    audience: process.env.JWT_AUDIENCE || 'tekbot-users',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
  session: {
    secret:
      process.env.SESSION_SECRET ||
      'your-session-secret-change-this-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 86400000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/google/callback',
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackUrl:
        process.env.MICROSOFT_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/microsoft/callback',
    },
  },
  passwordPolicy: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
  },
  lockout: {
    maxAttempts: parseInt(process.env.AUTH_MAX_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.AUTH_LOCKOUT_DURATION, 10) || 900000, // 15 minutes
  },
  twoFactor: {
    enabled: process.env.TWO_FACTOR_ENABLED === 'true',
    issuer: process.env.TWO_FACTOR_ISSUER || 'TekBot Platform',
    window: parseInt(process.env.TWO_FACTOR_WINDOW, 10) || 1,
  },
}));
