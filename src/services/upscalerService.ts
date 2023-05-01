import { spawn } from 'child_process';
import * as path from 'path';
import { Service } from 'typedi';

@Service()
class UpscalerService {
  private readonly condaExecutablePath = path.join(
    process.env.MINICONDA_PATH as string,
    'condabin',
    'conda.bat'
  );

  async installDependencies(): Promise<void> {
    console.log('Installing upscaler service dependencies...');
    await this.runCommands(
      [
        this.getActivateCondaCommand(),
        'pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118',
        'pip install basicsr',
        'pip install facexlib',
        'pip install gfpgan',
        'pip install -r requirements.txt',
        'python setup.py develop',
      ],
      process.env.ESRGAN_PATH as string
    );
    console.log('Installed upscaler service dependencies');
  }

  async upscale(
    inputFilePath: string,
    outputDirectory: string,
    fileName: string
  ): Promise<string> {
    console.log(
      `Upscaling ${inputFilePath} and saving it as ${outputDirectory}...`
    );
    await this.runCommands([
      this.getActivateCondaCommand(),
      `python ${path.join(
        process.env.ESRGAN_PATH as string,
        'inference_realesrgan.py'
      )} --input ${inputFilePath} --output ${outputDirectory} --model_path ${
        process.env.ESRGAN_MODEL_FILE_PATH as string
      } --tile 256`,
    ]);
    console.log(`Finished upscaling ${outputDirectory}`);
    const parsed = path.parse(fileName);
    const newFilename = `${parsed.name}_out${parsed.ext}`;
    const outputFilePath = path.join(outputDirectory, newFilename);
    return outputFilePath;
  }

  private async runCommands(
    commands: string[],
    workingDir?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const commandString = commands.join(' && ');
      console.log(`Executing ${commandString}...`);
      const childProcess = spawn(
        'cmd.exe',
        ['/c', commandString],
        workingDir ? { cwd: 'C:\\Projects\\Real-ESRGAN' } : undefined
      );

      // Log output from the child process
      childProcess.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      childProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      childProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Commands failed: ${commandString}`));
        } else {
          resolve();
        }
      });
    });
  }

  private getActivateCondaCommand(): string {
    return `${this.condaExecutablePath} activate ${
      process.env.MINICONDA_ENVIRONMENT as string
    }`;
  }
}

export { UpscalerService };
