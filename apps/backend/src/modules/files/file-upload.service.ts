import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import multer from 'multer';

@Injectable()
export class FileUploadService {
  private upload;
  constructor(private readonly configService: ConfigService) {
    this.upload = multer({
      limits: { fileSize: configService.get<number>('FILE_UPLOAD_MAX_SIZE', 10485760) },
      fileFilter: (req, file, cb) => {
        const allowed = configService.get<string>('FILE_UPLOAD_ALLOWED_TYPES', '').split(',');
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(null, false);
      },
    });
  }

  getUploader() {
    return this.upload;
  }
}
