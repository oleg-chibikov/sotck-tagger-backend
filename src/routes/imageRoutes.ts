import EventEmitter from 'events';
import express from 'express';
import multer, { MulterError } from 'multer';
import { uploadImage } from '../controllers/imageController';

// use type declarations for express and multer
import type { NextFunction, Request, Response } from 'express';
import type { Multer } from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }) as Multer;

// Create a new event emitter
const emitter = new EventEmitter();

router.post(
  '/upload',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        console.error(err);
      }
      next(err);
    });
  },
  // Pass the event emitter to the uploadImage controller
  (req, res) => uploadImage(req, res, emitter)
);

// Add the /events route for sending SSE
router.get('/events', (req, res) => {
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
  emitter.on('progress', (data) => {
    res.write(`event: progress\ndata: ${JSON.stringify(data)}\n\n`);
  });
});

export default router;
