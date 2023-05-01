import EventEmitter from 'events';
import { NextFunction, Request, Response } from 'express';
import { unlink } from 'fs';
import { Service } from 'typedi';
import { SftpService } from '../services/sftpService';
import { UpscalerService } from '../services/upscalerService';

// Use the @Service decorator to mark the class as injectable
@Service()
class ImageController {
  // Inject the sftp service as a dependency
  constructor(
    private sftpService: SftpService,
    private emitter: EventEmitter,
    private upscalerService: UpscalerService
  ) {}

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files) {
        throw Error('No image files provided');
      }
      const images = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flatMap((x) => x);

      // Create an array of promises for each image upload
      const promises = images.map(async (image) => {
        const outputDirectory = 'output';
        const outputFilePath = await this.upscalerService.upscale(
          image.path,
          outputDirectory,
          image.originalname
        );
        const result = await this.sftpService.uploadToSftp(
          outputFilePath,
          image.originalname,
          (fileName, transferred, total) => {
            // Emit an event with the progress of the file transfer
            this.emitter.emit('progress', { fileName, transferred, total });
          }
        );
        this.deleteFile(image.path);
        this.deleteFile(outputFilePath);
        return result;
      });

      // Wait for all the promises to resolve
      await Promise.all(promises);

      // Send a success response
      res.status(200).json({ message: 'Images uploaded successfully' });
    } catch (error) {
      next(error);
    }
  };

  private deleteFile = (path: string) => {
    unlink(path, () => {
      console.log(path + ' deleted');
    });
  };
}

export { ImageController };
