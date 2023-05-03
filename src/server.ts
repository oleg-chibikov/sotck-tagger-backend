import cors from 'cors';
import dotenv from 'dotenv';
import EventEmitter from 'events';
import type { Application } from 'express';
import express from 'express';
import * as fs from 'fs';
import 'reflect-metadata';
import Client from 'ssh2-sftp-client';
import { Container } from 'typedi';
import { errorLogger, errorResponder } from './middleware/errorHandling';
import { ImageRouter } from './routes/imageRouter';
import { CaptioningService } from './services/captioningService';
import { UpscalerService } from './services/upscalerService';

// Load environment variables from .env file
dotenv.config();
registerEventEmitter();
const registerSftp = registerSftpClient();
const app = express() as Application;
app.use(cors());
app.use(express.json());

function createFolderIfNotExists(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

const imageRouter = Container.get(ImageRouter).router;
app.use('/images', imageRouter);
// Error-handling middleware function - should go last
app.use(errorLogger);
app.use(errorResponder);

createFolderIfNotExists('uploads');
createFolderIfNotExists('output');

const upscalerService = Container.get(UpscalerService);
const captioningService = Container.get(CaptioningService);

const logError = (msg: string, err: any) =>
  console.error(msg, err.message ?? err);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);
  // Connect to the SFTP server after the app starts listening
  await registerSftp();
  await upscalerService.installDependencies();
  await captioningService.installDependencies();
});

function registerEventEmitter() {
  const emitter = new EventEmitter();
  Container.set(EventEmitter, emitter);
}

function registerSftpClient() {
  const sftp = new Client();
  // Define or import the sftpConfig object
  const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: parseInt(process.env.SFTP_PORT ?? ''),
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
  };
  // Register the sftp client with the Container
  Container.set(Client, sftp);

  // Disconnect from the SFTP server on app shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal');
    try {
      await sftp.end();
      console.log('Disconnected from sftp');
      process.exit(0);
    } catch (err: unknown) {
      logError('Failed to disconnect from sftp: ', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal');
    try {
      await sftp.end();
      console.log('Disconnected from sftp');
      process.exit(0);
    } catch (err: unknown) {
      logError('Failed to disconnect from sftp: ', err);
      process.exit(1);
    }
  });

  process.on('exit', async () => {
    console.log('Exiting app');
    try {
      await sftp.end();
      console.log('Disconnected from sftp');
    } catch (err: unknown) {
      logError('Failed to disconnect from sftp: ', err);
    }
  });

  return async () => {
    try {
      await sftp.connect(sftpConfig);
      console.log('Connected to sftp');
    } catch (err: unknown) {
      logError('Failed to connect to sftp:', err);
    }
  };
}
