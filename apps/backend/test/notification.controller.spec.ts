
import { NotificationController } from '../src/modules/notifications/notification.controller';
import { NotificationService } from '../src/modules/notifications/notification.service';

const mockSmtpService = { sendMail: jest.fn().mockResolvedValue(true) };
const mockTwilioService = { sendSms: jest.fn().mockResolvedValue(true) };
const mockSlackService = { sendMessage: jest.fn().mockResolvedValue(true) };

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService(
      mockSmtpService as any,
      mockTwilioService as any,
      mockSlackService as any
    );
    controller = new NotificationController(service);
  });

  it('should send email', async () => {
    const result = await controller.sendEmail({ to: 'test@tekbot.com', subject: 'Subject', html: '<p>Body</p>' });
    expect(result).toBe(true);
  });

  it('should send sms', async () => {
    const result = await controller.sendSms({ to: '+1234567890', message: 'Hello' });
    expect(result).toBe(true);
  });

  it('should send slack', async () => {
    const result = await controller.sendSlack({ channel: 'general', text: 'Hello Slack' });
    expect(result).toBe(true);
  });

  it('should send in-app notification', async () => {
    const result = await controller.sendInApp({ 
      userId: 'user1', 
      tenantId: 'tenant1',
      title: 'Test Notification',
      message: 'Hello In-App',
      type: 'info'
    });
    expect(result).toMatchObject({ userId: 'user1', message: 'Hello In-App', delivered: true });
  });
});
