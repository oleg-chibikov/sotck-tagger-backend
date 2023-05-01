import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 3000;

import type { Application } from 'express';
import express from 'express';
import imageRoutes from './routes/imageRoutes';
const app = express() as Application;
app.use(cors());

app.use(express.json());
app.use('/images', imageRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
