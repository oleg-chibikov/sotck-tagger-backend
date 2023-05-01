import * as path from 'path';
import Client from 'ssh2-sftp-client';

const sftp = new Client();

export const uploadToSftp = async (
  file: Express.Multer.File,
  onProgress: (transferred: number, total: number) => void
) => {
  const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: parseInt(process.env.SFTP_PORT ?? ''),
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
  };
  console.log('Connecting to sftp...');
  // Connect to the SFTP server
  await sftp.connect(sftpConfig);
  console.log('Connected to sftp');

  // Define the local and remote paths for the file
  const localPath = file.path;
  const remotePath = path.join('/remote/path', file.originalname);

  // Upload the file to the SFTP server using fastPut method
  await sftp.fastPut(localPath, remotePath, {
    // Set the concurrency and chunkSize options for fastPut
    concurrency: 64,
    chunkSize: 32768,
    // Set the step option to track the progress of the upload
    step: (transferred, chunk, total) => {
      console.log(`Transferred: ${transferred} / ${total}`);
      onProgress(transferred, total);
    },
  });

  // Disconnect from the SFTP server
  await sftp.end();
};
