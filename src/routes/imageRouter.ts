import EventEmitter from 'events';
import { Router } from 'express';
import multer, { MulterError } from 'multer';
import { Service } from 'typedi';
import { ImageController } from '../controllers/imageController';

// use type declarations for express and multer
import type { NextFunction, Request, Response } from 'express';
import type { Multer } from 'multer';

@Service()
class ImageRouter {
  public router: Router;
  private upload = multer({ dest: 'uploads/' }) as Multer;

  constructor(
    private imageController: ImageController,
    private emitter: EventEmitter
  ) {
    this.router = Router();
    this.setRoutes();
  }

  private setRoutes(): void {
    this.router.post(
      '/upload',
      (req: Request, res: Response, next: NextFunction) => {
        this.upload.array('images')(req, res, (err: unknown) => {
          if (err instanceof MulterError) {
            console.error(err);
          }
          next(err);
        });
      },
      this.imageController.uploadImage
    );

    // Add the /events route for sending SSE
    this.router.get('/events', (req, res) => {
      // Set the headers for an event stream
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:19000');

      // Send an initial event to the client
      res.write('data: Connected\n\n');

      // Listen for events from the event emitter
      this.emitter.on('progress', (data) => {
        res.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`);
      });
    });
  }
}

export { ImageRouter };
