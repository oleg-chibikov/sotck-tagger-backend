import { spawn } from 'child_process';
import type { Request } from 'express';
import path from 'path';

const getActivateCondaCommand = (): string => {
  return `${path.join(
    process.env.MINICONDA_PATH as string,
    'condabin',
    'conda.bat'
  )} activate ${process.env.MINICONDA_ENVIRONMENT as string}`;
};

const runCommands = async (
  commands: string[],
  workingDir?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const commandString = commands.join(' && ');
    console.log(`Executing ${commandString}...`);
    const childProcess = spawn(
      'cmd.exe',
      ['/c', commandString],
      workingDir ? { cwd: workingDir } : undefined
    );

    let output = '';
    let error = '';

    // Log output from the child process
    childProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    childProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    childProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Commands failed: ${commandString}: ${error}`));
      } else {
        resolve(output);
      }
    });
  });
};

const getImagesFromRequest = (req: Request): Express.Multer.File[] => {
  if (!req.files) {
    return [];
  }
  return Array.isArray(req.files)
    ? req.files
    : Object.values(req.files).flatMap((x) => x);
};

const generateRandomString = (length: number): string => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const removeEndingDot = (str: string): string => {
  return str.endsWith('.') ? str.slice(0, -1) : str;
};

export {
  removeEndingDot,
  getActivateCondaCommand,
  runCommands,
  getImagesFromRequest,
  generateRandomString,
};
