import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://s3.amazonaws.com'],
          connectSrc: ["'self'", 'https://api.stilova.com', 'wss://api.stilova.com'],
        },
      },
      crossOriginEmbedderPolicy: true,
      referrerPolicy: { policy: 'same-origin' },
    })(req, res, next);
  }
}
