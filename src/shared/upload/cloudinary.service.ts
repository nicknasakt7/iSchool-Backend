import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { TypedConfigService } from 'src/config/typed-config.service';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly typedConfigService: TypedConfigService) {
    cloudinary.config({
      cloud_name: typedConfigService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: typedConfigService.get('CLOUDINARY_API_KEY'),
      api_secret: typedConfigService.get('CLOUDINARY_API_SECRET'),
    });
  }

  upload(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const writableStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error || !result) {
            reject(new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );
      Readable.from(file.buffer).pipe(writableStream);
    });
  }
}
