import { NotificationService } from '../src/modules/notifications/notification.service';

const mockSmtpService = { sendMail: jest.fn().mockResolvedValue(true) };
const mockTwilioService = { sendSms: jest.fn().mockResolvedValue(true) };
const mockSlackService = { sendMessage: jest.fn().mockResolvedValue(true) };

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(
      mockSmtpService as any,
      mockTwilioService as any,
      mockSlackService as any,
    );
  });

  it('should send email', async () => {
    const result = await service.sendEmail({
      to: 'test@tekbot.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });
    expect(result).toBe(true);
  });

  it('should send sms', async () => {
    const result = await service.sendSms({
      to: '+1234567890',
      body: 'Hello',
    });
    expect(result).toBe(true);
  });

  it('should send slack', async () => {
    const result = await service.sendSlack({
      channel: 'general',
      text: 'Hello Slack',
    });
    expect(result).toBe(true);
  });

  it('should send in-app notification', async () => {
    const result = await service.sendInApp({
      userId: 'user1',
      tenantId: 'tenant1',
      title: 'Test',
      message: 'Hello In-App',
      type: 'info',
    });
    expect(result).toMatchObject({
      userId: 'user1',
      message: 'Hello In-App',
      delivered: true,
    });
  });
});
