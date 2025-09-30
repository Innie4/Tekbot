import { Controller, Post, UploadedFile, UseInterceptors, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { VirusScanService } from './virus-scan.service';

@Controller('files')
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    @Inject(VirusScanService) private readonly virusScanService: VirusScanService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { uploaded: false };
    const clean = await this.virusScanService.scanFile(file.buffer);
    if (!clean) return { uploaded: false, error: 'File failed virus scan' };
    return { uploaded: true, filename: file.originalname };
  }
}
