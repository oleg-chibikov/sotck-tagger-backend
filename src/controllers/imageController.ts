import EventEmitter from 'events';
import { Request, Response } from 'express';
import { unlink } from 'fs';
import { Service } from 'typedi';
import { SftpService } from '../services/sftpService';

// Use the @Service decorator to mark the class as injectable
@Service()
class ImageController {
  // Inject the sftp service as a dependency
  constructor(
    private sftpService: SftpService,
    private emitter: EventEmitter
  ) {}

  uploadImage = async (req: Request, res: Response) => {
    try {
      if (!req.files) {
        throw Error('No image files provided');
      }
      const images = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flatMap((x) => x);

      // Create an array of promises for each image upload
      const promises = images.map((image) => {
        const result = this.sftpService.uploadToSftp(
          image,
          (fileName, transferred, total) => {
            // Emit an event with the progress of the file transfer
            this.emitter.emit('progress', { fileName, transferred, total });
          }
        );
        unlink(image.path, () => {
          console.log(image.path + ' deleted');
        });
        return result;
      });

      // Wait for all the promises to resolve
      await Promise.all(promises);

      // Send a success response
      res.status(200).json({ message: 'Images uploaded successfully' });
    } catch (error) {
      // Handle errors
      res.status(500).json({
        message: 'An error occurred while uploading the images: ' + error,
      });
    }
  };
}

export { ImageController };
