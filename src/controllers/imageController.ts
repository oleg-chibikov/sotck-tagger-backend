import EventEmitter from 'events';
import { Request, Response } from 'express';
import { uploadToSftp } from '../services/sftpService';

export const uploadImage = async (
  req: Request,
  res: Response,
  emitter: EventEmitter
) => {
  try {
    // Get the image file from the request
    const image = req.file;

    if (!image) {
      throw Error('No image file provided');
    }

    // Upload the image to SFTP
    await uploadToSftp(image, (transferred, total) => {
      // Emit an event with the progress of the file transfer
      emitter.emit('progress', { transferred, total });
    });

    // Send a success response
    res.status(200).json({ message: 'Image uploaded successfully' });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      message: 'An error occurred while uploading the image: ' + error,
    });
  }
};
