import * as path from 'path';
import { Service } from 'typedi';
import { getActivateCondaCommand, runCommands } from './helper';

@Service()
class UpscalerService {
  async installDependencies(): Promise<void> {
    console.log('Installing upscaler service dependencies...');
    await runCommands(
      [
        getActivateCondaCommand(),
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
    await runCommands([
      getActivateCondaCommand(),
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
}

export { UpscalerService };
