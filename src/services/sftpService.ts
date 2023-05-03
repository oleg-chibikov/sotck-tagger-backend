import Client from 'ssh2-sftp-client';
import { Service } from 'typedi';

@Service()
export class SftpService {
  // Inject the sftp client as a dependency
  constructor(private sftp: Client) {}

  // Make the function a method of the class
  public async uploadToSftp(
    filePath: string,
    fileName: string,
    onProgress: (fileName: string, progress: number) => void // Add a file parameter to the callback
  ) {
    console.log(`Uploading ${filePath} to sftp...`);
    // Define the local and remote paths for the file
    const localPath = filePath;
    const remotePath = fileName;

    // Upload the file to the SFTP server using fastPut method
    await this.sftp.fastPut(localPath, remotePath, {
      // Set the concurrency and chunkSize options for fastPut
      concurrency: 64,
      chunkSize: 32768,
      // Set the step option to track the progress of the upload
      step: (transferred, _chunk, total) => {
        const progress = transferred / total;
        console.log(
          `Transferred: ${transferred} / ${total} (${
            progress * 100
          }%) for ${fileName}`
        );
        onProgress(fileName, progress); // Pass the file parameter to the callback
      },
    });
    // Do something after each file is uploaded
    console.log(`Upload successful for ${fileName}`);
  }
}
