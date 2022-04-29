import * as express from 'express';

import { Server, createServer } from 'http';

import CONFIG from './config';

export const startServer = (app: express.Application): Server => {
  const httpServer = createServer(app);

  return httpServer.listen({ port: CONFIG.APP.PORT }, (): void => {
    process.stdout.write(`⚙️  Application Environment: ${CONFIG.APP.ENV}\n`);
    process.stdout.write('📚 Debug logs are ENABLED\n');
    process.stdout.write(
      `🚀 LABNOTE-API Server ready at http://localhost:${CONFIG.APP.PORT}\n`,
    );
  });
};

import { Redis } from './service/redis';

export const startRedisClient = async () => {
  const redis = new Redis();
  redis.log('Starting up Redis client service...');
  await redis.initializeClient({
    port: CONFIG.REDIS.PORT || 6379,
    host: CONFIG.REDIS.HOST || '127.0.0.1',
  });
};

import * as fs from 'fs';

export const createUploadFolder = async () => {
  if (!fs.existsSync(CONFIG.EXTERNAL.UPLOADS_DIR))
    await fs.promises.mkdir(CONFIG.EXTERNAL.UPLOADS_DIR, { recursive: true });
};

export const testRedisClient = async () => {
  const redis = new Redis();
  redis.log(await redis.get('foo'));
  redis.set('foo', 'bar');
  redis.log(await redis.get('foo'));
  redis.del('foo');
  redis.log(await redis.get('foo'));
};
