import { NextFunction, Request, Response } from 'express';

interface CustomError extends Error {
  statusCode: number;
}

const errorLogger = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('\x1b[31m', err); // adding some color to our logs
  next(err);
};

const errorResponder = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.header('Content-Type', 'application/json');
  res.status(500).send(err.message);
  next(err);
};
export { errorLogger, errorResponder };
