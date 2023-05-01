import * as path from 'path';
import Client from 'ssh2-sftp-client';
import { Service } from 'typedi';

@Service()
export class SftpService {
  // Inject the sftp client as a dependency
  constructor(private sftp: Client) {}

  // Make the function a method of the class
  public async uploadToSftp(
    file: Express.Multer.File,
    onProgress: (fileName: string, transferred: number, total: number) => void // Add a file parameter to the callback
  ) {
    // Define the local and remote paths for the file
    const localPath = file.path;
    const remotePath = path.join('/remote/path', file.originalname);

    // Upload the file to the SFTP server using fastPut method
    await this.sftp.fastPut(localPath, remotePath, {
      // Set the concurrency and chunkSize options for fastPut
      concurrency: 64,
      chunkSize: 32768,
      // Set the step option to track the progress of the upload
      step: (transferred, chunk, total) => {
        console.log(
          `Transferred: ${transferred} / ${total} for ${file.originalname}`
        );
        onProgress(file.originalname, transferred, total); // Pass the file parameter to the callback
      },
    });
    // Do something after each file is uploaded
    console.log(`Upload successful for ${file.originalname}`);
  }
}
