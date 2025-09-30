import { FileUploadController } from '../src/modules/files/file-upload.controller';
import { FileUploadService } from '../src/modules/files/file-upload.service';


import { ConfigService } from '@nestjs/config';

describe('FileUploadController', () => {
  let controller: FileUploadController;
  let service: FileUploadService;
  let virusScanService: any;

  beforeEach(() => {
    const mockConfigService = {
      get: jest.fn((key: string, def?: any) => {
        if (key === 'FILE_UPLOAD_MAX_SIZE') return 10485760;
        if (key === 'FILE_UPLOAD_ALLOWED_TYPES') return 'image/png,image/jpeg';
        return def;
      }),
    } as Partial<ConfigService>;
    service = new FileUploadService(mockConfigService as ConfigService);
    virusScanService = { scanFile: jest.fn().mockResolvedValue(true) };
    controller = new FileUploadController(service, virusScanService);
  });

  it('should upload file', async () => {
    const file = { originalname: 'test.png', buffer: Buffer.from('data'), mimetype: 'image/png' } as any;
    const result = await controller.uploadFile(file);
    expect(result.uploaded).toBe(true);
    expect(result.filename).toBe('test.png');
  });
});
