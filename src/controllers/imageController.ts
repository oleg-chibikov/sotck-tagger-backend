import EventEmitter from 'events';
import { NextFunction, Request, Response } from 'express';
import { unlink } from 'fs';
import { Service } from 'typedi';
import { CaptioningService } from '../services/captioningService';
import { getImagesFromRequest } from '../services/helper';
import { SftpService } from '../services/sftpService';
import { UpscalerService } from '../services/upscalerService';

@Service()
class ImageController {
  constructor(
    private sftpService: SftpService,
    private emitter: EventEmitter,
    private upscalerService: UpscalerService,
    private captioningService: CaptioningService
  ) {}

  getImageCaptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.files) {
        throw Error('No image files provided');
      }
      const images = getImagesFromRequest(req);
      const annotationsPath = 'annotations\\captions_train2017.json';

      // Create an array of promises for each image upload
      const promises = images.map(async (image) => {
        try {
          const batchSize = req.query.batchSize
            ? Number(req.query.batchSize)
            : undefined;
          const numberOfAnnotations = req.query.numberOfAnnotations
            ? Number(req.query.numberOfAnnotations)
            : undefined;
          const numberOfResults = req.query.numberOfResults
            ? Number(req.query.numberOfResults)
            : undefined;
          const reverseImageSearchResults =
            await this.captioningService.generateCaptions(
              image.path,
              annotationsPath,
              batchSize,
              numberOfAnnotations,
              numberOfResults
            );

          console.log(
            `Reverse image search results for ${image.originalname}:`,
            reverseImageSearchResults
          );
          return reverseImageSearchResults;
        } finally {
          this.deleteFile(image.path);
        }
      });
      // Wait for all the promises to resolve
      const results = await Promise.all(promises);

      // Send a success response
      res.status(200).json({
        results: results
          .flatMap((x) => x)
          .sort((a, b) => b.similarity - a.similarity),
      });
    } catch (error) {
      next(error);
    }
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files) {
        throw Error('No image files provided');
      }
      const images = getImagesFromRequest(req);

      const upscaleProgress = 0.1;
      const halfProgress = 0.5;

      // Create an array of promises for each image upload
      const promises = images.map(async (image) => {
        const outputDirectory = 'output';
        const outputFilePath = await this.upscalerService.upscale(
          image.path,
          outputDirectory,
          image.filename
        );
        try {
          this.emitter.emit('progress', {
            fileName: image.originalname,
            progress: upscaleProgress,
            operation: 'upscale',
          });
          this.emitter.emit('progress', {
            fileName: image.originalname,
            progress: halfProgress,
            operation: 'ftp_upload',
          });
          const result = await this.sftpService.uploadToSftp(
            outputFilePath,
            image.originalname,
            (fileName, progress) => {
              // Emit an event with the progress of the file transfer
              this.emitter.emit('progress', {
                fileName,
                progress: halfProgress + progress / 2,
                operation: 'ftp_upload',
              });
            }
          );
          return result;
        } finally {
          this.deleteFile(image.path);
          this.deleteFile(outputFilePath);
        }
      });

      // Wait for all the promises to resolve
      await Promise.all(promises);

      // Send a success response
      res.status(200);
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
