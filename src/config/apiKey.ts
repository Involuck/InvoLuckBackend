import type { Request, Response, NextFunction } from 'express';

const REQUIRED_API_KEY = process.env.API_KEY;

export function checkApiKey(req: Request, res: Response, next: NextFunction) {
  const publicPaths = ['/api/v1/health', '/'];
  if (publicPaths.includes(req.path)) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== REQUIRED_API_KEY) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API Key'
      },
      requestId: (req as any).id
    });
  }

  next();
}
