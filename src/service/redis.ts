/**
 *   Set up a singleton class instance to interface
 *   with the Redis database, along with helper async
 *   functions that provide functionality.
 */

var redis = require('redis');

// https://github.com/redis/node-redis/issues/1673

type RedisClientType = ReturnType<typeof redis.createClient>;
type RedisClientOptionsType = Parameters<typeof redis.createClient>[0];

export class Redis {
  private static instance: Redis;
  private static client: RedisClientType;

  constructor() {
    if (Redis.instance) return Redis.instance;
    Redis.instance = this;
    Redis.client = null;
  }

  log(message: string) {
    console.log(`[Redis] ${message}`);
  }

  uuidv4() {
    let d = new Date().getTime(),
      d2 = (performance && performance.now && performance.now() * 1000) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16;
      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c == 'x' ? r : (r & 0x7) | 0x8).toString(16);
    });
  }

  async initializeClient(options: RedisClientOptionsType) {
    Redis.client = redis.createClient(options);
    Redis.client.on('connect', function () {
      Redis.instance.log('Client connected');
    });
    Redis.client.on('error', function (err: Error) {
      Redis.instance.log(`Could not communicate with Redis client [${err}]`);
    });
    await Redis.client.connect();
  }

  async shutdownClient() {
    await Redis.client.quit();
  }

  async multi() {
    await Redis.client.multi();
  }

  async exec() {
    await Redis.client.exec();
  }

  async hSet(k: string, f: string, v: string) {
    return await Redis.client
      .hSet(k, f, v)
      .catch((err: Error) => Promise.reject('hSet'));
  }

  async hSetNX(k: string, f: string, v: string) {
    return await Redis.client.hSetNX(k, f, v);
  }

  async hGet(k: string, f: string) {
    return await Redis.client.hGet(k, f);
  }

  async hGetAll(k: string) {
    return await Redis.client.hGetAll(k);
  }

  async hDel(k: string, f: string) {
    return await Redis.client.hDel(k, f);
  }

  async hExists(k: string, f: string) {
    return await Redis.client.hExists(k, f);
  }

  async hKeys(k: string) {
    return await Redis.client.hKeys(k);
  }

  async set(k: string, v: string) {
    return await Redis.client.set(k, v);
  }

  async setNX(k: string, v: string) {
    return await Redis.client.setNX(k, v);
  }

  async get(k: string) {
    return await Redis.client.get(k);
  }

  async exists(k: string) {
    return await Redis.client.exists(k);
  }

  async del(k: string) {
    return await Redis.client.del(k);
  }

  async sAdd(k: string, v: string) {
    return await Redis.client
      .sAdd(k, v)
      .catch((err: Error) => Promise.reject('sAdd'));
  }

  async sMembers(k: string) {
    return await Redis.client.sMembers(k);
  }
}
