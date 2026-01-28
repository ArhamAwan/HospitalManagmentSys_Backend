import dotenv from 'dotenv';

dotenv.config();

type NodeEnv = 'development' | 'production' | 'test';

interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
}

function getEnv(): Env {
  const {
    NODE_ENV = 'development',
    PORT = '5000',
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN = '24h',
    CORS_ORIGIN = 'http://localhost:3000'
  } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return {
    NODE_ENV: NODE_ENV as NodeEnv,
    PORT: Number(PORT),
    DATABASE_URL,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    CORS_ORIGIN
  };
}

export const env = getEnv();

