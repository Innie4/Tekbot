import { FileUploadService } from '../src/modules/files/file-upload.service';
import { ConfigService } from '@nestjs/config';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    service = new FileUploadService(configService);
  });

  it('should return uploader', () => {
    expect(service.getUploader()).toBeDefined();
  });
});
