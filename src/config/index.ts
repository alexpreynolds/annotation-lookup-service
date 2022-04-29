import pkg from '../../package.json';

require('dotenv').config();

const CONFIG = {
  APP: {
    NAME: pkg.name,
    VERSION: pkg.version,
    DESCRIPTION: pkg.description,
    AUTHORS: pkg.authors,
    HOST: process.env.APP_HOST,
    BASE_URL: process.env.API_BASE_URL,
    PORT: process.env.NODE_ENV === 'test' ? 8888 : process.env.PORT || 8080,
    ENV: process.env.NODE_ENV,
  },
  LOG: {
    PATH: process.env.LOGGING_DIR || 'logs',
    LEVEL: process.env.LOGGING_LEVEL || 'info',
    MAX_FILES: process.env.LOGGING_MAX_FILES || 5,
  },
  AUTH: {
    SALT_ROUNDS: process.env.SALT_ROUNDS || '11',
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_DURATION || '300000',
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_DURATION || '86400000',
    ACCESS_TOKEN_SALT: process.env.ACCESS_TOKEN_SALT,
    REFRESH_TOKEN_SALT: process.env.REFRESH_TOKEN_SALT,
  },
  AWS: {
    ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    SECRET_KEY: process.env.AWS_SECRET_KEY,
    REGION: process.env.AWS_REGION,
    S3: {
      PATH: process.env.S3_BUCKET_PATH,
      BUCKET_NAME: process.env.S3_BUCKET_NAME,
    },
    COGNITO: {
      USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
      CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    },
  },
  EXTERNAL: {
    API_KEY: process.env.API_KEY,
    UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
  },
  REDIS: {
    PORT: parseInt(process.env.REDIS_PORT as string) || 6379,
    HOST: process.env.REDIS_HOST || '127.0.0.1',
    PROJECTS_KEY: process.env.REDIS_PROJECTS_DEFAULT_KEY || 'projects',
    SET_TYPE_KEY: process.env.REDIS_SET_TYPE_DEFAULT_KEY || 'type',
    SET_TIMESTAMP_KEY:
      process.env.REDIS_SET_TIMESTAMP_DEFAULT_KEY || 'timestamp',
    SET_DESCRIPTION_KEY:
      process.env.REDIS_SET_DESCRIPTION_DEFAULT_KEY || 'description',
    SET_ASSEMBLY_KEY: process.env.REDIS_SET_ASSEMBLY_DEFAULT_KEY || 'assembly',
  },
};

export default CONFIG;
