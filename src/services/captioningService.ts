import path from 'path';
import { Service } from 'typedi';
import {
  getActivateCondaCommand,
  removeEndingDot,
  runCommands,
} from './helper';

interface CaptioningResult {
  caption: string;
  similarity: number;
}

@Service()
class CaptioningService {
  async installDependencies(): Promise<void> {
    console.log('Installing captioning service dependencies...');
    await runCommands(
      [getActivateCondaCommand(), 'pip install pycocotools openai-clip'],
      process.cwd()
    );
    console.log('Installed captioning service dependencies');
  }

  async generateCaptions(
    imagePath: string,
    annotationsPath: string,
    batchSize = 32,
    numberOfAnnotations = 600,
    numberOfResults = 10
  ): Promise<CaptioningResult[]> {
    const output = await runCommands(
      [
        getActivateCondaCommand(),
        `python ${this.getCaptioningDirectory(
          'run_search.py'
        )} ${imagePath} ${this.getCaptioningDirectory(
          annotationsPath
        )} --batch_size ${batchSize} --num_samples ${numberOfAnnotations} --num_results ${numberOfResults}`,
      ],
      process.cwd()
    );
    const lines = output.split('\n');
    const startIndex = lines.findIndex((line) =>
      line.includes('index created!')
    );

    if (startIndex === -1) {
      throw new Error('Index creation message not found in the output.');
    }

    return lines
      .slice(startIndex + 1)
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const [string, similarityText] = line.split('(similarity:');
        const similarity = parseFloat(
          similarityText.substring(0, similarityText.length - 2)
        );
        return {
          caption: removeEndingDot(string.trim()),
          similarity,
        } as CaptioningResult;
      });
  }

  private getCaptioningDirectory = (localPath: string) =>
    path.join('src', 'captioning', localPath);
}

export { CaptioningService };
