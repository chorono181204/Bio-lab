import { Request, Response } from 'express';

export function healthController(_req: Request, res: Response) {
  res.status(200).send('OK');
}


